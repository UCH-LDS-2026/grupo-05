#### Universidad Champagnat - Laboratorio de Desarrollo de Software - 2026

# Spot
## Grupo N° 5

Plataforma **two-sided** para descubrir, reseñar y fidelizar clientes en kioscos de barrio. Combina una app para clientes (**players**) con un panel para dueños de kiosco (**owners**) y un motor de promociones por reglas (frecuencia, monto, productos), más un rol de **admin** para la plataforma.

## Integrantes

- Gregorio Luján — [@lujangrego99](https://github.com/lujangrego99)
- Bautista Navarro — [@BautiNavarro](https://github.com/BautiNavarro)
- Matías Aguiar — [@matiasaguiar-dotcom](https://github.com/matiasaguiar-dotcom)
- Joel Aisama — [@aisamajoel-tech](https://github.com/aisamajoel-tech)

## 🚀 Probarlo (Docker, un solo comando)

Con **Docker** instalado y corriendo, desde la raíz del repo:

```bash
docker compose up --build
```

Eso levanta la base, el backend y el frontend, **aplica las migraciones y carga datos de demo automáticamente**. Cuando termine, abrí:

| Servicio | URL |
|---|---|
| App (web) | http://localhost:8081 |
| API | http://localhost:3001 |

Probá el login con el código **`SPOT2026`** (player). Credenciales y guía completa (verificada paso a paso) en **[DEPLOY.md](DEPLOY.md)**.

## Problema que resuelve

Los clientes recurrentes de kioscos de barrio no tienen forma centralizada de registrar visitas, comparar reseñas, descubrir locales ni recibir un beneficio por su fidelidad. Del otro lado, los dueños no pueden identificar a esos clientes, lanzarles promos segmentadas ni medir su impacto. Spot conecta ambos lados. El sistema es **agnóstico de marca**: la demo usa kioscos de Mendoza, pero escala a cualquier cadena o local independiente.

## Roles

- **Players** — clientes recurrentes (acceso por *invite code*).
- **Owners** — dueños/encargados de kiosco (registro + validación de un admin).
- **Admins** — equipo de plataforma (validan owners, generan invite codes, moderan).

## Funcionalidades

- Mapa interactivo de kioscos con pins visitado / no visitado
- Reseñas con puntaje por 5 categorías, tags y fotos
- Progreso personal, leaderboard y timeline grupal
- Panel del owner con métricas de su kiosco
- Motor de promociones por reglas (frecuencia, monto, productos)
- Canje de promos con código corto (+ QR opcional), validado por el owner

Detalle en [`trabajos-practicos/tp1/`](trabajos-practicos/tp1/).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend (player) | Expo (React Native) + React Native Web |
| Frontend (owner / admin) | Next.js (React) |
| Backend | NestJS (TypeScript) |
| Base de datos | PostgreSQL + Prisma ORM |
| Archivos | Cloudflare R2 (S3 compatible) |
| Auth | JWT con rol · invite code (player) / email+password (owner, admin) |
| Deploy | Docker (local) + Easypanel en VPS |
| CI | GitHub Actions (desde TP4) |

Justificación por capa en [`trabajos-practicos/tp2/justificacion-stack.md`](trabajos-practicos/tp2/justificacion-stack.md).

## Estado

| Parte | Estado |
|---|---|
| Modelo de dominio completo (11 clases) + migraciones | ✅ |
| Auth con roles (player / owner / admin) | ✅ |
| Flujo player (login → kioscos → visita → reseña) | ✅ |
| Deploy con Docker (un comando) | ✅ |
| Onboarding owner · motor de promos · canje | 🚧 en desarrollo |
| Backoffice admin · tests + CI | ⏳ pendiente |

## Estructura del repo

```
grupo-05/
├── docker-compose.yml          Stack completo (db + api + app)
├── DEPLOY.md                   Guía de deploy con Docker (verificada)
├── pnpm-workspace.yaml         Monorepo pnpm → src/apps/*
├── docs/                       Documentación viva
│   ├── arquitectura.md
│   ├── modelo-datos.md
│   ├── contratos.md            Contratos compartidos entre features
│   └── estrategia-ramas.md
├── src/apps/
│   ├── api/                    Backend NestJS + Prisma
│   │   ├── prisma/             schema.prisma + migrations + seed
│   │   └── src/                auth, kiosks, visits, reviews, ...
│   └── app/                    Frontend Expo (web)
├── tests/                      Tests (desde TP4)
└── trabajos-practicos/         Entregables por TP (tp1..tp5)
```

## Cómo trabajamos

`main` está **protegida**: nada de commits directos. Cada feature/fix va en su rama, se abre un **Pull Request** contra `main` con **1 review** de otro integrante y se mergea con **squash**. Detalle en [`docs/estrategia-ramas.md`](docs/estrategia-ramas.md).

Para correr en modo desarrollo (sin Docker, con hot-reload) ver la sección *Desarrollo local* de [DEPLOY.md](DEPLOY.md).
