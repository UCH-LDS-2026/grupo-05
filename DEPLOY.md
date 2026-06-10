# Deploy de Spot con Docker

> Guía **probada end-to-end** (db + API + frontend) el 2026-06-09. Levanta todo
> el proyecto con **un solo comando**, sin pasos manuales de base de datos.

## Requisito único

**Docker** (con Docker Compose v2) instalado y corriendo.

```bash
docker --version          # 24+
docker compose version    # v2.x
```

> En Windows/Mac: instalá **Docker Desktop** y dejalo abierto (si no, da
> `cannot connect to the Docker daemon`). En Linux: el servicio `docker` activo.

No hace falta Node, pnpm ni Postgres en tu máquina: todo corre dentro de los contenedores.

---

## Levantar el proyecto

Desde la raíz del repo:

```bash
docker compose up --build
```

Qué hace, en orden:

1. **`spot-db`** — PostgreSQL 16. El stack espera a que esté *healthy*.
2. **`spot-api`** — NestJS. Al arrancar, automáticamente:
   - aplica las migraciones (`prisma migrate deploy`),
   - si la base está vacía (primera vez), carga **datos de demo** (seed),
   - levanta la API.
3. **`spot-app`** — bundle web estático de Expo, servido en el puerto 8081.

Cuando veas `🟠 Spot API escuchando...` y el front compilado, abrí:

| Servicio | URL |
|---|---|
| **App (web)** | http://localhost:8081 |
| **API** | http://localhost:3001 |

(Agregá `-d` para correrlo en segundo plano: `docker compose up --build -d`.)

---

## Credenciales de demo

El seed deja la plataforma lista para probar los 3 roles:

| Rol | Cómo entrar |
|---|---|
| **Player** | código de invitación `SPOT2026` o `YESMZA` (+ tu nombre). `DEMO` viene precargado con visitas/reseñas (player "Sofi"). |
| **Owner** | `owner@spot.dev` / `spot1234` (ya validado, con 3 kioscos y una promo) |
| **Admin** | `admin@spot.dev` / `spot1234` |

### Probar el flujo del player

1. Abrí http://localhost:8081 → login con `SPOT2026` y tu nombre.
2. Vas a ver 6 kioscos con rating, tags y visitas.
3. Entrá a un kiosco → **Marcar visita**.
4. Puntuá las 5 categorías, comentá y **Publicar reseña** → el promedio se actualiza.

---

## Comandos útiles

| Comando | Para qué |
|---|---|
| `docker compose up --build` | construir y levantar todo |
| `docker compose up --build -d` | igual, en segundo plano |
| `docker compose logs -f` | ver logs en vivo (todos) |
| `docker compose logs -f api` | logs solo del backend |
| `docker compose down` | apagar (los datos persisten en el volumen) |
| `docker compose down -v` | apagar y **borrar la base** (reset total) |
| `docker compose restart api` | reiniciar solo el backend |

> Atajos equivalentes desde `package.json`: `pnpm up`, `pnpm down`, `pnpm reset`, `pnpm logs`.

Los datos viven en el volumen `spot_db_data` y persisten entre `up`/`down`. El
seed corre **solo cuando la base está vacía**: si reiniciás, no se pisan los datos.
Para empezar de cero: `docker compose down -v && docker compose up --build`.

---

## Acceso desde otra PC o celular (misma red)

El front detecta la IP del host en runtime (`src/apps/app/lib/api.ts`): si entrás
por `http://<IP-de-tu-PC>:8081`, las llamadas al API van a `http://<IP-de-tu-PC>:3001`
automáticamente. Asegurate de que el firewall permita los puertos **8081** y **3001**.

---

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `cannot connect to the Docker daemon` | Docker no está corriendo. Abrí Docker Desktop / iniciá el servicio. |
| `port is already allocated` (3001/8081/5433) | Algo ya usa ese puerto. Cerralo, o cambiá el mapeo en `docker-compose.yml` (lado izquierdo del `:`). |
| El front carga pero no trae datos | ¿`spot-api` está *Up*? Mirá `docker compose logs -f api`. |
| Quiero datos frescos | `docker compose down -v && docker compose up --build`. |
| Cambié código y no se refleja | Reconstruí: `docker compose up --build` (sin caché: `--build --no-cache`). |

---

## Deploy en VPS (Easypanel) — objetivo

El mismo `docker-compose.yml` se usa como base en Easypanel. Variables a setear en
producción (no usar las de demo):

- `DATABASE_URL` — Postgres del servidor
- `JWT_SECRET` — clave random larga
- `EXPO_PUBLIC_API_URL` — URL pública del API (build arg del servicio `app`)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — para fotos de reseñas

---

## Desarrollo local (sin Docker, con hot-reload)

Para trabajar en el código con recarga en caliente conviene correr el backend y el
front directamente, usando solo Docker para la base:

```bash
# Requisitos: Node 20+, pnpm 9+
pnpm install

# 1. Solo la base en Docker
pnpm db:up                         # Postgres en localhost:5433

# 2. Envs locales (apuntan a localhost:5433)
cp src/apps/api/.env.example src/apps/api/.env
cp src/apps/app/.env.example src/apps/app/.env

# 3. Migrar + seedear
cd src/apps/api && pnpm prisma:migrate && pnpm seed && cd ../..

# 4. Backend con watch (terminal 1)
pnpm api:dev                       # http://localhost:3001

# 5. Front con Metro (terminal 2)
pnpm app:web                       # http://localhost:8081
```

Detalle de arquitectura en [`docs/arquitectura.md`](docs/arquitectura.md) y modelo
de datos en [`docs/modelo-datos.md`](docs/modelo-datos.md).
