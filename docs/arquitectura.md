# Arquitectura del sistema

> Spot es una plataforma **two-sided**: players (clientes, app móvil), owners
> (dueños de kiosco, panel web) y admins (plataforma).
>
> **Estado (post Fase 0):** el **modelo de dominio completo (11 clases)** y la
> **autenticación con roles** (player por invite code; owner/admin por
> email+password; JWT con `role`) están implementados. Los módulos de feature del
> lado owner —onboarding, motor de promociones, canje— se desarrollan en Fase 1
> sobre estos contratos (ver [contratos.md](./contratos.md)). El flujo del player
> (login → kioscos → visita → reseña) ya está funcional.

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
| `auth` | Login player (invite), registro/login owner, login admin; JWT con rol | `POST /auth/login`, `POST /auth/owner/register`, `POST /auth/owner/login`, `POST /auth/admin/login`, `GET /auth/me` |
| `kiosks` | Listado y detalle de kioscos (con promedio de rating y tags) | `GET /kiosks`, `GET /kiosks/:id` |
| `visits` | Registro de visitas de un player a un kiosco | `POST /kiosks/:id/visits` |
| `reviews` | Alta/edición de reseña (1 por player por kiosco) | `POST /kiosks/:id/reviews` |

> Módulos de Fase 1 (sobre los contratos ya definidos): `owner` (onboarding +
> panel), `promotions` (motor de reglas), `redemptions` (canje).

**Autenticación con roles**: tres caminos de login —player por `InviteCode`,
owner/admin por email+password (hash con `bcryptjs`)—. El owner se registra en
estado `PENDIENTE_VALIDACION` (lo valida un admin). El JWT
(`{ sub, name, role }`, con `role ∈ {PLAYER, OWNER, ADMIN}`) viaja en
`Authorization: Bearer`. `JwtAuthGuard` lo verifica y adjunta `req.user`; el
decorator `@CurrentUser()` lo inyecta. Para gatear por rol: `RolesGuard` +
`@Roles('OWNER')`. `@CurrentPlayer()` se mantiene para los endpoints del player.

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

## Cómo correr

Deploy con Docker (un comando) y desarrollo local: ver [`DEPLOY.md`](../DEPLOY.md).
