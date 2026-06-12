# Spot

Plataforma **two-sided** para descubrir, reseñar y fidelizar clientes en kioscos de
barrio.

- **Players** (app móvil/web): ingresan con código de invitación, marcan visitas,
  dejan reseñas por 5 categorías y canjean promociones.
- **Owners** (panel): registran su kiosco, definen promociones por reglas y validan
  canjes en el mostrador.
- **Admins**: validan owners y moderan.

**Stack:** NestJS + Prisma + PostgreSQL (backend) · Expo / React Native Web
(frontend) · monorepo pnpm · Docker.

> TP de **Laboratorio de Desarrollo de Software** — Grupo 5 (UCH 2026).

---

## Correr todo en local con Docker (recomendado)

Es la misma forma en que se construye el deploy: cada servicio se levanta desde su
`Dockerfile`. Solo necesitás **Docker Desktop** abierto.

```bash
docker compose up -d --build
```

Esto levanta los 4 servicios:

| Servicio | URL | Qué es |
|---|---|---|
| **app** | http://localhost:8081 | Frontend (Expo web) |
| **api** | http://localhost:3001 | Backend (NestJS) |
| **pgweb** | http://localhost:8082 | Explorador de la base |
| **db** | localhost:5433 | PostgreSQL 16 |

La API aplica las migraciones y, **si la base está vacía**, carga datos de demo
automáticamente (`docker-entrypoint.sh`). Cuando veas `🟠 Spot API escuchando…`,
abrí **http://localhost:8081**.

```bash
docker compose logs -f api     # ver el arranque / migraciones / seed
docker compose down            # apagar (los datos quedan en el volumen)
docker compose down -v         # apagar y borrar los datos (reset total)
```

### Cuentas de demo (seed)

| Rol | Acceso |
|---|---|
| **Player** | códigos `SPOT2026` / `YESMZA` (libres, los activás con tu nombre) · `DEMO` (player "Sofi", precargada con visitas y reseñas) |
| **Owner** | `owner@spot.dev` / `spot1234` (ya validado, con kioscos) |
| **Admin** | `admin@spot.dev` / `spot1234` |

---

## Correr en modo desarrollo (sin Docker para el código)

Útil para iterar con hot-reload. Solo la base va en Docker.

```bash
pnpm install                       # 1. dependencias (monorepo)
docker compose up -d db            # 2. solo Postgres
cd src/apps/api
cp .env.example .env               # 3. envs (los defaults ya funcionan)
pnpm prisma:migrate                #    crea las tablas
pnpm seed                          #    carga los datos de demo
pnpm start:dev                     # 4. backend en watch → :3001
# en otra terminal, desde la raíz:
pnpm app:web                       #    frontend Expo web → :8081
```

> En la primera corrida pnpm puede avisar que "ignoró build scripts": ya está
> contemplado (`onlyBuiltDependencies`), Prisma y esbuild se compilan igual.

---

## Tests

```bash
# Backend — unit (servicios con Prisma mockeado)
cd src/apps/api && pnpm test

# Backend — e2e (levanta el AppModule real contra Postgres; requiere la base arriba)
docker compose up -d db
cd src/apps/api && pnpm test:e2e

# Frontend — componentes (jest-expo + testing-library)
cd src/apps/app && pnpm test
```

Cobertura: motor de promociones (reglas FREQUENCY/AMOUNT/PRODUCTS, caps, vigencia,
audiencia), canje, autenticación, servicios de kioscos/visitas/reseñas; flujo e2e
`login → kioscos → visita → reseña`; y los componentes `Stars` / `RatingPicker`.

---

## Estructura del proyecto

```
.
├── docker-compose.yml          db + api + app + pgweb (build desde los Dockerfiles)
├── pnpm-workspace.yaml         workspace → src/apps/*
├── src/apps/
│   ├── api/                    Backend NestJS + Prisma
│   │   ├── prisma/             schema.prisma (dominio de 12 entidades) + seed.ts
│   │   ├── src/
│   │   │   ├── auth/           login player (invite) + owner/admin, JWT con rol
│   │   │   ├── kiosks/         listado y detalle de kioscos
│   │   │   ├── visits/         registro de visitas
│   │   │   ├── reviews/        reseñas por 5 categorías
│   │   │   ├── promotions/     motor de promociones por reglas (+ CRUD del owner)
│   │   │   └── redemptions/    canje: código corto + QR, validación en mostrador
│   │   ├── test/               tests e2e
│   │   └── Dockerfile
│   └── app/                    Frontend Expo (web)
│       ├── app/                pantallas: login, owner/*, kiosks, kiosks/[id], redeem
│       ├── components/         Stars, RatingPicker
│       └── Dockerfile
└── docs/                       arquitectura.md, modelo-datos.md, diagramas UML
```

Más detalle en [`docs/arquitectura.md`](docs/arquitectura.md) y
[`docs/modelo-datos.md`](docs/modelo-datos.md).

---

## Deploy

Cada push a `main` dispara el autodeploy (build de los `Dockerfile` de `api` y
`app`). El contenedor de la API corre las migraciones (`prisma migrate deploy`) al
arrancar y siembra la base solo si está vacía.

Workflow del equipo: `main` protegida, una rama por feature/fix, PR con review
cruzado (nadie aprueba su propio PR), squash merge.

---

## Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `cannot connect to the Docker daemon` | Docker Desktop no está abierto. Abrilo y reintentá. |
| `port 5433/3001/8081 already in use` | Ya hay algo en ese puerto. Cambiá el mapeo en `docker-compose.yml`. |
| El front carga pero no trae kioscos | ¿La API está arriba (`docker compose logs api`)? ¿`EXPO_PUBLIC_API_URL` apunta a `:3001`? |
| Quiero empezar de cero con la base | `docker compose down -v` y volvé a levantar. |
| Compila lento en Windows | Si el repo está en `/mnt/c/...` bajo WSL, el FS de Windows es más lento. Conviene clonarlo en el FS de Linux (`~/`). |
