# Estrategia de ramas — Spot

El Grupo 5 adopta **GitHub Flow simple** como modelo de branching. Es el flujo más práctico para un equipo chico (4 estudiantes) que entrega de manera incremental sobre un único entorno.

## Modelo

```
main (protegida)
  ├── feature/onboarding-owner       (Matías)
  ├── feature/motor-promociones      (Bauti)
  ├── feature/canje-qr               (Joel)
  └── fix/auth-invite-code           (Grego)
```

- **`main`** es la rama estable. Nunca se commitea directamente. Siempre representa código que compila y pasa tests.
- Cada **feature** o **fix** se desarrolla en una rama propia que arranca desde `main`.
- Al terminar una feature se abre un **Pull Request** contra `main`.
- El PR requiere **al menos 1 review** de otro integrante antes de mergearse.
- Mergeo con **squash** para mantener el historial de `main` limpio (un commit por feature).
- La rama de feature se borra después del merge.

## Convención de nombres de rama

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `feature/` | Nueva funcionalidad | `feature/leaderboard-grupal` |
| `fix/` | Bug fix | `fix/error-canje-expirado` |
| `docs/` | Solo documentación | `docs/diagramas-tp3` |
| `chore/` | Cambios de tooling, deps, CI | `chore/upgrade-prisma` |
| `refactor/` | Refactor sin cambio funcional | `refactor/promo-engine` |

## Convención de commits

Estilo **Conventional Commits** (corto, en imperativo):

```
feat(promos): agregar regla de monto acumulado
fix(auth): validar formato de invite code antes de query
docs(tp2): sumar diagrama de clases
chore(deps): bump Expo SDK a 52
```

## Protección de `main`

Configurada en GitHub Settings → Branches → Branch protection rules para `main`:

- ✅ Require a pull request before merging
- ✅ Require approvals: **1**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging (cuando exista CI en TP4)
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings (incluye administradores)
- ❌ No se permite force push
- ❌ No se permite borrar `main`

## Flujo típico de un integrante

```bash
# 1. Sincronizar con main
git checkout main
git pull origin main

# 2. Crear rama de feature
git checkout -b feature/mi-feature

# 3. Trabajar y commitear
git add .
git commit -m "feat(modulo): descripción corta"

# 4. Pushear y abrir PR
git push -u origin feature/mi-feature
# → Abrir PR en github.com/UCH-LDS-2026/grupo-05
# → Pedir review a otro integrante

# 5. Después del merge: limpieza local
git checkout main
git pull origin main
git branch -d feature/mi-feature
```

## Releases (a partir del TP5)

A partir del TP5 (proyecto final / 2° parcial) se etiquetan releases con tags semver:
`v0.1.0`, `v0.2.0`, `v1.0.0` (entrega final). Cada tag corresponde a un commit de `main`.
