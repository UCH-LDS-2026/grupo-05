#### Universidad Champagnat - Laboratorio de Desarrollo de Software - 2026

# Spot
## Grupo N° 5

Plataforma two-sided para descubrir, reseñar y fidelizar clientes en kioscos de barrio. Combina una app móvil para clientes (players) con un panel web para dueños de kiosco (owners) y un motor de promociones por reglas (frecuencia, monto, productos).

## Integrantes

- Gregorio Luján — [@lujangrego99](https://github.com/lujangrego99)
- Bautista Navarro — [@BautiNavarro](https://github.com/BautiNavarro)
- Matías Aguiar — [@matiasaguiar-dotcom](https://github.com/matiasaguiar-dotcom)
- Joel Aisama — [@aisamajoel-tech](https://github.com/aisamajoel-tech)

## Problema que resuelve

Los clientes recurrentes de los kioscos de barrio en Mendoza no tienen forma centralizada de registrar sus visitas, comparar reseñas, descubrir locales nuevos ni recibir un beneficio por su fidelidad. Del otro lado, los dueños de kiosco no tienen forma de identificar a esos clientes recurrentes, lanzarles promos segmentadas ni medir su impacto. Spot conecta ambos lados en una sola plataforma. El piloto del MVP arranca con kioscos Yes Mendoza, pero el sistema es agnóstico de marca y escala a cualquier cadena o local independiente.

## Usuarios

Sistema multi-rol two-sided:
- **Players** — clientes recurrentes (acceso por invite code)
- **Owners** — dueños/encargados de kiosco (registro abierto + validación)
- **Admins** — equipo de plataforma (catálogo, validaciones, moderación)

## Funcionalidades principales

- Mapa interactivo de kioscos con pins visitado/no visitado
- Reseñas con puntaje por categorías, tags y fotos
- Stats personales, leaderboard y timeline grupal
- Panel del owner con métricas de su kiosco
- Motor de promociones por reglas (frecuencia, monto, productos)
- Canje de promos con código corto + QR, validado por el owner

Detalle completo en [`trabajos-practicos/tp1/definicion-proyecto.md`](trabajos-practicos/tp1/definicion-proyecto.md).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend mobile (player) | Expo (React Native) + React Native Web |
| Frontend web (owner / admin) | Next.js (React) |
| Backend | NestJS (TypeScript) |
| Base de datos | PostgreSQL + Prisma ORM |
| Almacenamiento de archivos | Cloudflare R2 (S3 compatible) |
| Auth | JWT + invite codes (player) / registro+validación (owner) |
| Deploy | Docker + Easypanel en VPS |
| CI | GitHub Actions |

Justificación detallada por capa en [`trabajos-practicos/tp2/justificacion-stack.md`](trabajos-practicos/tp2/justificacion-stack.md).

## Setup del entorno

Requisitos previos en cada equipo:

| Tool | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 20.x LTS | `node -v` |
| pnpm | 9.x | `pnpm -v` |
| Git | 2.40+ | `git --version` |
| PostgreSQL | 16.x (local o vía Docker) | `psql --version` |
| Docker + Docker Compose | 24+ / v2 | `docker --version` |
| Expo CLI | última estable | `npx expo --version` |

### Clonar y arrancar

```bash
# 1. Clonar el repo
git clone https://github.com/UCH-LDS-2026/grupo-05.git
cd grupo-05

# 2. Instalar dependencias (cuando exista código en TP3+)
pnpm install

# 3. Variables de entorno
cp .env.example .env
# Editar .env con credenciales locales

# 4. Levantar la base de datos local (Docker)
docker compose up -d db

# 5. Aplicar migraciones (cuando exista schema)
pnpm prisma migrate dev

# 6. Arrancar backend (puerto 3001)
pnpm --filter api dev

# 7. Arrancar frontend mobile (Expo)
pnpm --filter app start

# 8. Arrancar panel web owner (Next.js, puerto 3000)
pnpm --filter owner dev
```

> **Nota**: el código vivo del proyecto se incorpora a partir del TP3 (Diseño del Sistema). Esta guía describe el setup objetivo del entorno; en TP2 se valida la instalación de las herramientas en cada equipo del grupo (capturas en [`trabajos-practicos/tp2/entorno-instalado.md`](trabajos-practicos/tp2/entorno-instalado.md)).

## Estrategia de ramas

El equipo trabaja con **GitHub Flow simple**: `main` protegida + feature branches por integrante/tarea + PR con review obligatorio antes de mergear. Detalle en [`docs/estrategia-ramas.md`](docs/estrategia-ramas.md).

## Estructura del repositorio

```
grupo-05/
├── docs/                          Documentación viva del proyecto
│   ├── arquitectura.md
│   ├── modelo-datos.md
│   ├── product-discovery.md
│   ├── estrategia-ramas.md
│   ├── casos-de-uso.svg
│   └── diagrama-clases.svg
├── src/                           Código fuente (a partir de TP3)
├── tests/                         Tests (a partir de TP4)
├── trabajos-practicos/            Entregables por TP
│   ├── tp1/  → Definición del proyecto
│   ├── tp2/  → Setup técnico (este TP)
│   ├── tp3/  → Diseño del sistema
│   ├── tp4/  → Calidad y testing
│   └── tp5/  → Proyecto final
└── README.md
```

## Cronograma

| TP | Entregable | Estado |
|---|---|---|
| TP1 | Definición del proyecto | ✅ Entregado |
| TP2 | Setup técnico (este) | 🚧 En curso |
| TP3 | Diseño del sistema (arquitectura + datos) | ⏳ Pendiente |
| TP4 | Calidad y testing | ⏳ Pendiente |
| TP5 | Proyecto final (sistema funcional + demo) | ⏳ Pendiente |
