# Contratos compartidos (Fase 1)

> Interfaces estables que dejó la **Fase 0** para que las ramas de Fase 1
> (owner, motor de promos, canje) trabajen contra una misma forma de datos sin
> pisarse. Si una rama necesita cambiar un contrato, se avisa al equipo y se
> actualiza acá primero.
>
> Fuente de verdad del modelo: [`schema.prisma`](../src/apps/api/prisma/schema.prisma).
> Los enums se exponen tal cual los define Prisma (mismos literales).

## Convenciones

- Auth por `Authorization: Bearer <JWT>`. El JWT lleva `{ sub, name, role }`.
  - `role ∈ { "PLAYER", "OWNER", "ADMIN" }`.
  - Para gatear endpoints por rol: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('OWNER')`.
  - El sujeto autenticado se inyecta con `@CurrentUser()` (`{ id, name, role }`).
    `@CurrentPlayer()` sigue disponible para los endpoints del player.
- IDs: `string` (cuid). Fechas: ISO 8601 (`string`) en JSON.
- Montos: `number`. Porcentajes: `number` 0–100.

---

## Enums (compartidos)

```ts
type Role = 'PLAYER' | 'OWNER' | 'ADMIN';
type OwnerStatus = 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO';
type PromotionRuleType = 'FREQUENCY' | 'AMOUNT' | 'PRODUCTS';
type RewardType = 'FREE_PRODUCT' | 'DISCOUNT_PCT' | 'DISCOUNT_AMOUNT' | 'TWO_FOR_ONE';
type RedemptionStatus = 'PENDING' | 'REDEEMED' | 'EXPIRED';
```

---

## Auth (ya implementado en Fase 0)

| Endpoint | Body | Respuesta |
|---|---|---|
| `POST /auth/login` | `{ code, name? }` | `{ token, role:'PLAYER', player:{id,name} }` |
| `POST /auth/owner/register` | `{ name, email, password }` | `{ token, role:'OWNER', owner:{id,name,status} }` |
| `POST /auth/owner/login` | `{ email, password }` | `{ token, role:'OWNER', owner:{id,name,status} }` |
| `POST /auth/admin/login` | `{ email, password }` | `{ token, role:'ADMIN', admin:{id,name} }` |
| `GET /auth/me` | — (Bearer) | `{ id, name, role }` |

Un owner recién registrado queda en `PENDIENTE_VALIDACION`: puede loguearse, pero
las acciones de owner deben chequear `status === 'VALIDADO'` (lo valida un Admin
en Fase 2).

---

## Owner — onboarding y panel (Matías)

```ts
// Crear/editar kiosco del owner (owner dueño → 1..N kioscos)
interface KioskUpsert {
  name: string;
  address: string;
  city?: string;        // default "Mendoza"
  brand?: string | null;
  lat?: number | null;
  lng?: number | null;
}

// Dashboard del kiosco
interface KioskStats {
  kioskId: string;
  uniqueVisitors: number;   // players distintos con visita
  avgRating: number | null; // 1-5, promedio de las 5 categorías
  reviewCount: number;
  redemptionCount: number;  // canjes REDEEMED
}
```

Endpoints sugeridos (rama `feature/onboarding-owner`):
`GET/POST/PATCH /owner/kiosks`, `GET /owner/kiosks/:id/stats`.

---

## Motor de promociones (Bauti)

```ts
interface PromotionRuleInput {
  type: PromotionRuleType;
  // FREQUENCY: minVisits + windowDays | AMOUNT: minAmount + windowDays | PRODUCTS: products[]
  minVisits?: number;
  minAmount?: number;
  windowDays?: number;
  products?: string[];
}

interface PromotionInput {
  kioskId: string;
  title: string;
  description?: string;
  active?: boolean;             // default true
  rewardType: RewardType;
  rewardValue?: number | null;  // % o $ (null para FREE_PRODUCT / TWO_FOR_ONE)
  rewardProduct?: string | null;
  audienceDays?: number[];      // 0=Dom..6=Sáb; [] = todos
  audienceFromHour?: number | null; // 0-23
  audienceToHour?: number | null;   // 0-23
  capPerPlayer?: number | null;
  capPerPeriod?: number | null;
  capTotal?: number | null;
  periodDays?: number | null;
  rules: PromotionRuleInput[];  // se combinan con AND
  startsAt?: string | null;     // ISO
  endsAt?: string | null;       // ISO
}

// Lo que el motor devuelve al evaluar un player en un kiosco
interface ActivePromotion {
  promotionId: string;
  title: string;
  rewardType: RewardType;
  rewardValue: number | null;
  rewardProduct: string | null;
  eligible: boolean;            // ¿el player cumple reglas + audiencia + caps?
}
```

El motor evalúa "al abrir el detalle del kiosco o al registrar una visita"
(criterio del TP1). CRUD de promos vive dentro del panel del owner (UI de Matías).

---

## Canje (Joel) — depende del motor de Bauti

```ts
// Player pide canjear una promo activa → código corto que expira en 10 min
interface RedemptionStartResponse {
  redemptionId: string;
  code: string;                 // 6 chars alfanuméricos
  status: 'PENDING';
  expiresAt: string;            // ISO (now + 10 min)
  promotion: { id: string; title: string; rewardType: RewardType };
}

// Owner valida en mostrador
interface RedemptionValidateInput {
  code: string;
}
interface RedemptionValidateResponse {
  redemptionId: string;
  status: RedemptionStatus;     // REDEEMED si ok; error si EXPIRED / ya usado
  redeemedAt: string | null;
}
```

Reglas: el código es lo principal (QR opcional). Al validar: chequear no
expirado, no canjeado, y que respete los `cap*` de la promo; marcar `REDEEMED`
y setear `redeemedAt`. Endpoints sugeridos: `POST /redemptions` (player),
`POST /redemptions/validate` (owner).

---

## Player (Grego) — consume el contrato de promo

En el detalle del kiosco, el player ve las `ActivePromotion[]` con `eligible`
y, si aplica, dispara `POST /redemptions` para obtener su código corto.
