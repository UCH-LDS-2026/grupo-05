# Cómo correr los tests

El proyecto tiene tres capas de tests:

| Capa | Qué prueba | Dónde | Cantidad |
|---|---|---|---|
| **Backend — unit** | Servicios con Prisma mockeado: motor de promociones, canje, auth, kioscos, visitas, reseñas | `src/apps/api/src/**/*.spec.ts` | 40 |
| **Backend — e2e** | El AppModule real contra Postgres: `login → /kiosks (401 sin token) → visita → reseña` | `src/apps/api/test/app.e2e-spec.ts` | 5 |
| **Frontend** | Componentes `Stars` y `RatingPicker` (render + interacción) | `src/apps/app/components/*.test.tsx` | 6 |

---

## Requisitos

- **Node 20+** y **pnpm 9+**.
- `pnpm install` en la raíz (una vez).
- **Docker Desktop abierto** — sólo para los tests **e2e** (levantan una base Postgres).

---

## Todo de una

Desde la **raíz** del repo:

```bash
pnpm test:all
```

Corre las tres tandas en orden: unit → frontend → e2e. Salida esperada: **51 tests en verde**.

> El orden es a propósito: unit y frontend no necesitan Docker, así que corren primero. La tanda e2e va última porque levanta la base.

---

## Por separado

```bash
pnpm test:api    # 40 unit del backend (genera el cliente Prisma + jest)
pnpm test:app    # 6 de frontend (jest-expo + testing-library)
pnpm test:e2e    # 5 e2e (levanta la base con docker compose --wait y corre supertest)
```

También se pueden correr desde cada paquete:

```bash
cd src/apps/api && pnpm test          # unit
cd src/apps/api && pnpm test:e2e      # e2e (requiere la base arriba)
cd src/apps/app && pnpm test          # frontend
```

---

## Detalles útiles

- **Cliente Prisma:** los unit del API type-checkean contra `@prisma/client`. Los scripts `test:api` / `test:e2e` corren `prisma generate` antes; si corrés jest a mano y ves `Property 'promotion' does not exist on type 'PrismaService'`, ejecutá `pnpm --filter @spot/api run prisma:generate`.
- **Base aislada del e2e:** el e2e usa un schema separado (`e2e_test`) en la misma base de Docker, así no pisa datos de desarrollo. Lo migra y lo limpia solo.
- **Cobertura:** `cd src/apps/api && pnpm test:coverage` genera un reporte HTML en `src/apps/api/coverage/`.

---

## Gotcha en Windows + WSL

Si el repo está en `C:\...` (= `/mnt/c/...` en WSL) y alguna vez instalaste las dependencias desde **WSL**, los binarios nativos (esbuild, prisma engines) quedan compilados para Linux y **no corren en CMD de Windows** (y viceversa). Si ves errores raros de binarios al cambiar de entorno:

```cmd
rmdir /s /q node_modules
pnpm install
```

Para evitarlo del todo, conviene clonar el repo en el filesystem de Linux (`~/`) si vas a trabajar desde WSL.
