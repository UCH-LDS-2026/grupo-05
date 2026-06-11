# Código fuente

Monorepo (pnpm workspaces) con las aplicaciones de Spot:

```
src/apps/
├── api/    Backend NestJS + Prisma + PostgreSQL  (auth con roles, kiosks, visits, reviews, ...)
└── app/    Frontend Expo / React Native Web      (login, lista, detalle, reseña)
```

- **Cómo correr / deployar**: ver [`DEPLOY.md`](../DEPLOY.md).
- **Arquitectura**: ver [`docs/arquitectura.md`](../docs/arquitectura.md).
- **Modelo de datos**: ver [`docs/modelo-datos.md`](../docs/modelo-datos.md).
- **Contratos compartidos**: ver [`docs/contratos.md`](../docs/contratos.md).
