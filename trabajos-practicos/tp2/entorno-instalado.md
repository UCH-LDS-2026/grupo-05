# Entorno de desarrollo — capturas por integrante

Cada integrante validó la instalación de las herramientas requeridas y adjuntó captura de la salida del siguiente bloque:

```bash
echo "=== Spot — entorno local ===" && \
node -v && \
pnpm -v && \
git --version && \
psql --version && \
docker --version && \
npx expo --version
```

## Versiones esperadas

| Tool | Versión mínima |
|---|---|
| Node.js | 20.x LTS |
| pnpm | 9.x |
| Git | 2.40+ |
| PostgreSQL | 16.x |
| Docker | 24+ |
| Expo CLI | última estable |

## Capturas

### Gregorio Luján (Windows 11 + WSL2 Ubuntu 22.04)

![Entorno Grego](entorno-instalado/grego.png)

```
Node v20.18.0
pnpm 9.12.3
git 2.43.0
psql (PostgreSQL) 16.4
Docker 24.0.7
Expo 0.21.0
```

### Bautista Navarro

> _Pendiente: pegar captura en `entorno-instalado/bauti.png` y completar versiones._

### Matías Aguiar

> _Pendiente: pegar captura en `entorno-instalado/matias.png` y completar versiones._

### Joel Aisama

> _Pendiente: pegar captura en `entorno-instalado/joel.png` y completar versiones._

---

## Troubleshooting frecuente

| Problema | Solución |
|---|---|
| `pnpm: command not found` | `npm install -g pnpm@9` |
| Postgres no conecta en localhost | Verificar que el servicio esté corriendo: `sudo service postgresql start` (Linux/WSL) o el servicio en Windows |
| Error de permisos en WSL al instalar deps en `/mnt/c/...` | Trabajar en el filesystem nativo de Linux: `~/projects/spot` |
| Expo CLI lento al primer `npx expo start` | Es normal, descarga el binario por única vez |
