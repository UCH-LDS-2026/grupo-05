# Código fuente

Monorepo (pnpm workspaces) con las aplicaciones del MVP **slice player** de Spot:

```
src/apps/
├── api/    Backend NestJS + Prisma + PostgreSQL  (auth, kiosks, visits, reviews)
└── app/    Frontend Expo / React Native Web      (login, lista, detalle, reseña)
```

- **Cómo correr**: ver [`docs/correr-mvp.md`](../docs/correr-mvp.md).
- **Arquitectura**: ver [`docs/arquitectura.md`](../docs/arquitectura.md).
- **Modelo de datos**: ver [`docs/modelo-datos.md`](../docs/modelo-datos.md).
