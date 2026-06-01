# Cómo correr el MVP (slice player)

## Requisitos

- Node.js 20+
- pnpm 9+ (`npm i -g pnpm`)
- Docker (para la base de datos)

## Pasos

Desde la raíz del repo:

```bash
# 1. Instalar dependencias del monorepo
pnpm install

# 2. Levantar PostgreSQL en Docker
pnpm db:up           # docker-compose up -d db  (Postgres en localhost:5433)

# 3. Preparar la base (migración + datos de demo)
cd src/apps/api
cp ../../../.env.example .env     # si todavía no existe el .env del api
pnpm prisma:migrate               # crea las tablas
pnpm seed                         # carga kioscos, tags y códigos de demo
cd ../../..

# 4. Levantar el backend (NestJS) → http://localhost:3001
pnpm api:dev

# 5. En otra terminal, levantar el frontend (Expo web) → http://localhost:8081
pnpm app:web
```

Abrí **http://localhost:8081** en el navegador.

## Probar el flujo

1. **Login**: ingresá el código `SPOT2026` (o `YESMZA`) y tu nombre → Entrar.
2. **Lista de kioscos**: vas a ver 6 kioscos con su rating, tags y visitas.
3. **Detalle**: entrá a un kiosco → **Marcar visita**.
4. **Reseña**: puntuá las 5 categorías (atención, variedad, limpieza, precios,
   ambiente), escribí un comentario y **Publicar reseña**. El promedio del
   kiosco se actualiza al instante.

> Código pre-cargado con datos: `DEMO` (player "Sofi", ya tiene visitas y reseñas).

## Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `DATABASE_URL` | `src/apps/api/.env` | Conexión a Postgres |
| `JWT_SECRET` | `src/apps/api/.env` | Firma de tokens |
| `API_PORT` | `src/apps/api/.env` | Puerto del backend (default 3001) |
| `EXPO_PUBLIC_API_URL` | `src/apps/app/.env` | URL del backend que consume el front |

> Los `.env` no se commitean. Ver `.env.example` en la raíz como plantilla.

## Estructura

```
grupo-05/
├── docker-compose.yml          Postgres 16
├── pnpm-workspace.yaml         workspace → src/apps/*
├── src/apps/
│   ├── api/                    Backend NestJS + Prisma
│   │   ├── prisma/             schema.prisma + seed.ts
│   │   └── src/                auth, kiosks, visits, reviews
│   └── app/                    Frontend Expo (web)
│       ├── app/                pantallas (expo-router)
│       ├── components/         Stars, RatingPicker
│       └── lib/                api, auth, storage
└── docs/                       arquitectura.md, modelo-datos.md, ...
```
