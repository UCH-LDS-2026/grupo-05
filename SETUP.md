# Spot — MVP (slice player) · Guía para correrlo local

> **Empezá por acá.** Esta guía te lleva de una PC limpia a tener el MVP de Spot
> corriendo en el navegador en ~10 minutos. Pensada para que cualquier dev del
> equipo lo levante sin vueltas.

Spot es una plataforma para descubrir y puntuar kioscos. Este MVP cubre el lado
**player**: ingresás con un código de invitación, ves kioscos, marcás visitas y
dejás reseñas con puntaje por categorías.

- **Backend**: NestJS + Prisma + PostgreSQL (en Docker)
- **Frontend**: Expo / React Native Web (corre en el navegador)
- **Monorepo**: pnpm workspaces

---

## 1. Requisitos previos

Instalá estas 3 cosas (si ya las tenés, salteá):

| Herramienta | Versión | Cómo instalar |
|---|---|---|
| **Node.js** | 20 LTS o más | https://nodejs.org (instalá la versión "LTS") |
| **pnpm** | 9+ | con Node ya instalado: `npm install -g pnpm` |
| **Docker** | Desktop | https://www.docker.com/products/docker-desktop/ (Windows/Mac) |

Verificá que todo esté ok (abrí una terminal):

```bash
node -v      # v20.x.x o superior
pnpm -v      # 9.x.x o superior
docker -v    # Docker version 2x.x.x
```

> **Importante (Docker)**: después de instalar Docker Desktop, **abrilo y dejalo
> corriendo** (ícono de la ballenita en la barra de tareas). Si Docker Desktop no
> está abierto, el comando para levantar la base va a fallar con algo tipo
> *"cannot connect to the Docker daemon"*.

---

## 2. Levantar la base de datos (PostgreSQL en Docker)

No hace falta instalar Postgres: corre dentro de un contenedor Docker definido en
`docker-compose.yml`. Desde la **raíz del proyecto**:

```bash
docker compose up -d db
```

Esto:
- descarga la imagen `postgres:16` (solo la primera vez),
- crea un contenedor llamado `spot-db`,
- expone Postgres en **localhost:5433** (usamos 5433 y no el 5432 default para no
  chocar con un Postgres que ya tengas instalado),
- guarda los datos en un volumen Docker (persisten aunque apagues el contenedor).

Comprobá que esté arriba:

```bash
docker ps            # deberías ver el contenedor "spot-db"
```

| Comando útil | Para qué |
|---|---|
| `docker compose up -d db` | levantar la base |
| `docker compose stop` | pausar (sin borrar datos) |
| `docker compose down` | apagar y borrar el contenedor (los datos quedan en el volumen) |
| `docker compose down -v` | apagar y **borrar también los datos** (reset total) |
| `docker logs spot-db` | ver los logs de la base |

> Si usás una versión vieja de Docker, el comando puede ser `docker-compose` (con
> guion) en lugar de `docker compose`. Ambos hacen lo mismo.

---

## 3. Instalar dependencias

Desde la **raíz del proyecto**:

```bash
pnpm install
```

> La primera vez tarda un poco (baja todo NestJS, Expo, etc.). pnpm puede avisar
> que "ignoró build scripts" — ya está contemplado en la config del repo
> (`onlyBuiltDependencies`), así que Prisma y esbuild se compilan igual.

---

## 4. Configurar variables de entorno (.env)

Hay dos `.env` que crear a partir de las plantillas `.env.example` (no se
commitean porque pueden tener secretos). Desde la raíz:

```bash
# Backend
cp src/apps/api/.env.example src/apps/api/.env

# Frontend
cp src/apps/app/.env.example src/apps/app/.env
```

> En Windows (PowerShell) usá `copy` en vez de `cp`, o copialos a mano.

Los valores por defecto ya funcionan para correr todo en tu PC. No hace falta tocar
nada.

---

## 5. Preparar la base (tablas + datos de demo)

```bash
cd src/apps/api
pnpm prisma:migrate     # crea las tablas en Postgres
pnpm seed               # carga kioscos, tags y códigos de invitación de demo
cd ../..
```

El seed deja:
- 6 kioscos (Yes Mendoza + uno independiente) con tags,
- códigos de invitación **`SPOT2026`** y **`YESMZA`** (libres, los activás con tu nombre),
- código **`DEMO`** ya activado (player "Sofi") con visitas y reseñas de ejemplo.

---

## 6. Levantar el proyecto

Necesitás **dos terminales** (backend y frontend corren a la vez).

**Terminal 1 — Backend** (desde la raíz):

```bash
pnpm api:dev
```

Esperá a ver: `🟠 Spot API escuchando en http://localhost:3001`

**Terminal 2 — Frontend** (desde la raíz):

```bash
pnpm app:web
```

Cuando termine de compilar, abrí **http://localhost:8081** en el navegador.

---

## 7. Probar el flujo 🎉

1. **Login**: ingresá el código `SPOT2026` (o `YESMZA`) y tu nombre → **Entrar**.
2. **Lista**: vas a ver 6 kioscos con su rating, tags y cantidad de visitas.
3. **Detalle**: tocá un kiosco → **Marcar visita**.
4. **Reseña**: puntuá las 5 categorías (atención, variedad, limpieza, precios,
   ambiente), escribí un comentario y **Publicar reseña**. El promedio del kiosco
   se actualiza al toque.

---

## 8. Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `cannot connect to the Docker daemon` | Docker Desktop no está abierto. Abrilo y reintentá. |
| `port 5433 already in use` | Ya tenés algo en ese puerto. Cambiá el `5433:5432` en `docker-compose.yml` (ej. `5434:5432`) y actualizá el puerto en `src/apps/api/.env`. |
| `port 3001 already in use` | Cambiá `API_PORT` en `src/apps/api/.env` y `EXPO_PUBLIC_API_URL` en `src/apps/app/.env`. |
| El front carga pero no trae kioscos / da error de red | ¿Está corriendo el backend (Terminal 1)? ¿`EXPO_PUBLIC_API_URL` apunta al puerto correcto? |
| `Environment variable not found: DATABASE_URL` | Falta el `.env` en `src/apps/api/` (paso 4). |
| Prisma se queja del cliente no generado | Corré `cd src/apps/api && pnpm prisma:generate`. |
| Quiero empezar de cero con la base | `docker compose down -v` y repetí desde el paso 2 + paso 5. |
| Compila muy lento (Windows) | Si el proyecto está en una ruta de Windows bajo WSL (`/mnt/c/...`), Metro va más lento. Es normal; la primera compilación del front puede tardar 1-2 min. |

---

## Estructura del proyecto

```
.
├── docker-compose.yml          PostgreSQL 16 (contenedor spot-db, puerto 5433)
├── pnpm-workspace.yaml         workspace → src/apps/*
├── package.json                scripts del monorepo (db:up, api:dev, app:web, seed)
├── .env.example                referencia de variables
├── SETUP.md                    ESTA guía
├── src/apps/
│   ├── api/                    Backend NestJS + Prisma
│   │   ├── prisma/             schema.prisma + seed.ts
│   │   ├── src/                auth (JWT/invite), kiosks, visits, reviews
│   │   └── .env.example        plantilla de envs del backend
│   └── app/                    Frontend Expo (web)
│       ├── app/                pantallas (expo-router): login, kiosks, kiosks/[id]
│       ├── components/         Stars, RatingPicker
│       ├── lib/                api, auth, storage
│       └── .env.example        plantilla de envs del frontend
└── docs/                       arquitectura.md, modelo-datos.md, correr-mvp.md, diagramas
```

Más detalle técnico en [`docs/arquitectura.md`](docs/arquitectura.md) y
[`docs/modelo-datos.md`](docs/modelo-datos.md).

---

## Scripts rápidos (desde la raíz)

| Script | Hace |
|---|---|
| `pnpm db:up` | levanta Postgres en Docker (= `docker compose up -d db`) |
| `pnpm api:dev` | corre el backend en modo dev (watch) |
| `pnpm app:web` | corre el frontend Expo en web |
| `pnpm seed` | recarga los datos de demo (resetea kioscos/códigos) |
