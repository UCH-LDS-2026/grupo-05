# TP4 — Calidad y Testing · Spot MVP

**Laboratorio de Desarrollo de Software**

---

## ¿Qué es esto?

Este documento explica qué se hizo para el TP4 y cómo correr los tests unitarios del proyecto.

El TP pedía:
1. **Tests unitarios** — mínimo 3 tests que cubran lógica de negocio real
2. **Ejecutables desde CLI** — que corran con `npm test` sin configuración manual
3. **Reporte de cobertura** — captura o archivo en `/docs`

Todo está cubierto.

---

## Qué se testeó

Se escribieron **7 tests unitarios** distribuidos en 3 archivos, uno por cada servicio principal del MVP:

| Archivo | Servicio | Qué verifica |
|---|---|---|
| `kiosks.service.spec.ts` | `KiosksService` | Cálculo de `avgRating` con múltiples reseñas; `avgRating` null sin reseñas; error si el kiosco no existe; datos de visitas y reseña propias del player |
| `reviews.service.spec.ts` | `ReviewsService` | Crear reseña nueva; actualizar reseña existente; error si el kiosco no existe |
| `visits.service.spec.ts` | `VisitsService` | Registrar visita y retornar total acumulado; error si el kiosco no existe |

Los tests son **unitarios puros**: usan mocks de la base de datos, así que corren sin necesidad de tener PostgreSQL levantado ni ningún `.env` configurado.

---

## Cómo correr los tests (paso a paso)

### Requisitos previos
- Tener instalado [Node.js](https://nodejs.org) (v18 o superior)
- Tener instalado [pnpm](https://pnpm.io): `npm install -g pnpm`

### Primera vez (setup)

```bash
# 1. Entrar a la carpeta del proyecto
cd spot-mvp

# 2. Instalar dependencias
pnpm install

# 3. Aprobar los builds de Prisma y NestJS (se pide la primera vez)
pnpm approve-builds
# → presionar A para seleccionar todo, luego Enter, luego confirmar con Y

# 4. Generar el cliente de Prisma (necesario para que TypeScript reconozca los modelos)
cd src/apps/api
npx prisma generate --schema=prisma/schema.prisma
```

### Correr los tests

```bash
# Desde src/apps/api
npm test
```

Deberías ver algo así:

```
PASS  src/kiosks/kiosks.service.spec.ts
PASS  src/reviews/reviews.service.spec.ts
PASS  src/visits/visits.service.spec.ts

Test Suites: 3 passed, 3 total
Tests:       7 passed, 7 total
```

### Correr con reporte de cobertura

```bash
npm run test:coverage
```

Se genera una carpeta `src/apps/api/coverage/`. Abrí `coverage/index.html` en el navegador para ver el reporte visual.

---

## Estructura de archivos agregados para el TP4

```
spot-mvp/
├── docs/
│   └── TP4-testing.md                          ← este archivo
└── src/apps/api/
    ├── jest.config.js                          ← configuración de Jest
    ├── package.json                            ← scripts test y test:coverage
    └── src/
        ├── kiosks/kiosks.service.spec.ts
        ├── reviews/reviews.service.spec.ts
        └── visits/visits.service.spec.ts
```

---

## Decisiones técnicas

- **Framework de testing**: Jest + ts-jest (estándar en proyectos NestJS con TypeScript)
- **Sin base de datos en los tests**: se mockea `PrismaService` con `jest.fn()`, lo que permite testear la lógica de negocio de forma aislada y rápida
- **Cobertura sobre `*.service.ts`**: los controladores y módulos son wiring de NestJS, la lógica real vive en los servicios
- **`jest.clearAllMocks()` en cada test**: evita que un test contamine al siguiente

