# Justificación del stack — Spot

> Este documento es la versión navegable de la sección 6 del [TP2](tp2.md). El criterio de elección de cada capa se justifica en función del problema que resuelve Spot: una plataforma two-sided con app móvil para players, panel web para owners y un motor de promociones por reglas.

## Frontend mobile (player) — Expo (React Native) + React Native Web

El player consume la app principalmente desde el celular: marca visitas, escanea QR, ve el mapa de kioscos. Necesitamos despliegue rápido en iOS y Android con un solo codebase. **Expo** resuelve esto con un toolchain unificado, OTA updates y módulos nativos para mapas, cámara (canje QR) y geolocalización. Sumar **React Native Web** nos da una versión web complementaria del lado player sin escribir nada extra, útil para los integrantes durante desarrollo y para la demo.

**Alternativas descartadas:**
- **Flutter** — requeriría aprender Dart y el equipo ya tiene experiencia en React/TS.
- **Nativo puro (Swift/Kotlin)** — doble codebase no justificable para un MVP.

## Frontend web (owner / admin) — Next.js (React)

El panel del owner es densamente informacional: dashboards con KPIs, formularios complejos del motor de promociones, listados de canjes. El formato móvil-first de Expo no es óptimo: necesitamos layout web responsive, SEO eventual de páginas públicas y SSR para vistas con datos sensibles. **Next.js** es el estándar de facto para apps web con React y se integra naturalmente con el resto del stack TypeScript.

## Backend — NestJS (TypeScript)

NestJS es opinionado, modular y trae soporte nativo para inyección de dependencias, validación, guards, interceptors y testing. Para un proyecto con varios módulos diferenciados (auth, kiosks, reviews, promotions, redemptions, admin) la estructura modular de NestJS facilita asignar features a distintos integrantes sin pisarse. El motor de promociones encaja como un servicio dedicado con sus propios casos de prueba.

**Alternativas descartadas:**
- **Express puro** — sin estructura impuesta, escalaría mal con 4 personas.
- **Django / Rails** — lenguajes distintos al frontend; perderíamos el tipado compartido entre capas.

## Base de datos — PostgreSQL + Prisma ORM

El dominio de Spot es fuertemente relacional: kioscos, visitas, reseñas, promociones, canjes y reglas tienen integridad referencial estricta. **PostgreSQL** suma soporte robusto de JSONB (para `PromotionRule.params`), índices geoespaciales (PostGIS si se necesita para el mapa) y tipos enum nativos.

**Prisma** se elige sobre TypeORM porque su schema declarativo único genera tipos TypeScript automáticamente para el cliente, lo que reduce errores y duplicación entre capas.

**Alternativas descartadas:**
- **MongoDB** — las relaciones críticas del dominio harían joins manuales en aplicación, perdiendo las garantías del motor relacional.
- **TypeORM** — API menos ergonómica, generación de tipos menos confiable.

## Decisiones cross

- **TypeScript único** en frontend, backend y scripts: reduce el cambio de contexto y permite compartir tipos entre capas.
- **Cloudflare R2** (no S3): mismo protocolo, sin egress charges. Importante porque las reseñas pueden incluir varias fotos por visita.
- **Auth dual** — JWT + invite codes para players (cerrado), registro abierto + validación manual para owners (sin OAuth de terceros).
- **Docker + Easypanel** sobre VPS: reproducible, económico, sin lock-in con un cloud provider, auto-deploy desde `main`.
