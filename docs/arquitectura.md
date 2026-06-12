# Arquitectura del sistema

> MVP **slice player** de Spot: el cliente (player) ingresa por invitación,
> descubre kioscos, registra visitas y deja reseñas con puntaje por categorías.
> El lado owner (motor de promociones, validación de canjes) está modelado en el
> dominio pero queda fuera de este MVP.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Expo (React Native + React Native Web) — un codebase, corre en web/iOS/Android. Routing con expo-router. |
| **Backend** | NestJS (TypeScript), modular por feature. Auth con JWT. |
| **Base de datos** | PostgreSQL 16 (en Docker) + Prisma ORM. |
| **Infra dev** | Docker Compose para la DB. Monorepo con pnpm workspaces. |

## Arquitectura general

Monorepo con dos aplicaciones que se comunican por HTTP/JSON:

```
┌─────────────────────────┐         HTTP/JSON          ┌──────────────────────────┐
│   apps/app (Expo Web)    │  ───────────────────────►  │   apps/api (NestJS)        │
│   - login (invite code)  │   Authorization: Bearer    │   - AuthModule  (JWT)      │
│   - lista de kioscos     │   <JWT>                    │   - KiosksModule           │
│   - detalle + visita     │  ◄───────────────────────  │   - VisitsModule           │
│   - reseña por categorías│         JSON               │   - ReviewsModule          │
└─────────────────────────┘                            └────────────┬──────────────┘
                                                                     │ Prisma Client
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │  PostgreSQL 16        │
                                                          │  (Docker: spot-db)    │
                                                          └──────────────────────┘
```

### Backend (NestJS)

Organizado en módulos por feature. Cada módulo expone su controller y delega la
lógica en su service; el acceso a datos pasa por un `PrismaService` global.

| Módulo | Responsabilidad | Endpoints |
|---|---|---|
| `auth` | Login por código de invitación, emisión y verificación de JWT | `POST /auth/login`, `GET /auth/me` |
| `kiosks` | Listado y detalle de kioscos (con promedio de rating y tags) | `GET /kiosks`, `GET /kiosks/:id` |
| `visits` | Registro de visitas de un player a un kiosco | `POST /kiosks/:id/visits` |
| `reviews` | Alta/edición de reseña (1 por player por kiosco) | `POST /kiosks/:id/reviews` |

**Autenticación**: el login valida el `InviteCode`. Si nunca se canjeó, da de alta
al `Player` (con su nombre); si ya tiene player asociado, re-emite el token. El JWT
(`{ sub: playerId, name }`) viaja en el header `Authorization: Bearer`. Un guard
(`JwtAuthGuard`) lo verifica y adjunta el player a la request; el decorator
`@CurrentPlayer()` lo inyecta en los controllers.

**Validación**: DTOs con `class-validator` + `ValidationPipe` global (whitelist).

### Frontend (Expo Web)

- **expo-router** (file-based): `app/login.tsx`, `app/kiosks/index.tsx`, `app/kiosks/[id].tsx`.
- **Estado de sesión**: `AuthProvider` (Context) + persistencia en `localStorage` (web).
- **Cliente HTTP**: wrapper `fetch` que inyecta el token y centraliza el manejo de errores (`lib/api.ts`).
- **UI**: componentes propios (`Stars`, `RatingPicker`) y paleta de marca en `theme.ts`.

## Decisiones de diseño

- **Monorepo (pnpm workspaces)**: backend y frontend en un solo repo, tipos y
  flujo de trabajo unificados. Las apps viven bajo `src/apps/` (`api`, `app`).
- **Prisma**: schema declarativo como única fuente de verdad del modelo; tipos
  TypeScript autogenerados compartidos por los services.
- **Reseña como upsert** (`@@unique([playerId, kioskId])`): un player tiene una
  sola reseña por kiosco, editable, en lugar de acumular duplicados.
- **Slice acotado**: se implementa la ruta de valor del player end-to-end antes
  que abarcar todo el dominio, para tener algo funcional y demostrable.

## Cómo correr

Ver [correr-mvp.md](./correr-mvp.md).
