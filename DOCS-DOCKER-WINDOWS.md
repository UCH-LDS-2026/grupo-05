# Guía de Dockerización Completa en Windows · Spot MVP

Esta guía detalla toda la configuración, cambios y comandos realizados para dockerizar y ejecutar por completo el MVP de Spot de forma nativa en tu entorno Windows, resolviendo los problemas comunes de red y dependencias de Prisma en Docker.

---

## 🛠️ Herramientas Instaladas

1. **pnpm** (v11.5.0): Instalado de forma global en Windows (`npm install -g pnpm`) para gestionar las dependencias del monorepo en local.
2. **Docker Desktop** (v29.4.3): Instalado nativamente en Windows mediante `winget`. Esto provee el motor Docker y el comando `docker compose` de forma directa sin necesidad de usar WSL.

---

## 🌐 Configuración e Integraciones Clave

### 1. Detección Dinámica de IP (Acceso en Red Local)
* Modificamos el archivo `src/apps/app/lib/api.ts` del frontend para resolver dinámicamente la IP del host desde el navegador:
  ```typescript
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3001`; // Mismo host, puerto 3001 del Backend
      }
    }
    return process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
  };
  ```
  Esto permite que cualquier celular o computadora conectada a tu **Wi-Fi** (`192.168.0.14`) o **Hotspot** (`192.168.137.1`) acceda a la app de forma transparente sin modificar archivos `.env`.

### 2. Bypass de Antigüedad de Paquetes en pnpm v11
* pnpm v11 bloquea de forma predeterminada la instalación de paquetes con menos de 24 horas de publicación. Añadimos `minimumReleaseAge: 0` al archivo `pnpm-workspace.yaml` (y en los Dockerfiles) para evitar que falle la instalación de dependencias como `react-native`.

### 3. Dependencias de Prisma en el Contenedor
* El backend de NestJS utiliza `Prisma ORM` el cual ejecuta binarios de motor de esquema de bajo nivel.
* Reemplazamos la imagen base de la API de Alpine a `node:20-slim` (basada en Debian) e instalamos `openssl ca-certificates procps` para asegurar compatibilidad de librerías del sistema y habilitar el modo watch (`nest start --watch`) de NestJS en Docker de manera estable.

---

## 🏗️ Servicios Configurados en `docker-compose.yml`

* **`db` (Postgres 16)**: Puerto interno `5432`, expuesto a Windows en el puerto `5433` (para acceso de base de datos desde el host).
* **`api` (NestJS)**: Puerto `3001` expuesto. Se comunica internamente con la base de datos a través de la URL de conexión `postgresql://spot:spot_dev_pw@db:5432/spot`.
* **`app` (Expo Web)**: Puerto `8081` expuesto. Levanta el bundle web de la app de Expo.

---

## 💻 Comandos Útiles de Administración

Todos los comandos se ejecutan desde la raíz del proyecto (`C:\Users\samsung\Documents\spot-mvp-solo\spot-mvp`):

### 1. Iniciar todo el stack (Base de datos, Backend y Frontend)
```bash
docker compose up --build -d
```
*El parámetro `--build` asegura que se detecte cualquier cambio en el código y se actualice el contenedor, y `-d` lo ejecuta en segundo plano.*

### 2. Aplicar migraciones y datos de prueba (Seed)
Cada vez que borres o recrees la base de datos desde cero, ejecuta estos comandos dentro del contenedor de la API para sincronizar tablas y cargar kioscos de demo:
```bash
# Sincronizar esquema de base de datos
docker exec spot-api pnpm --dir src/apps/api prisma:migrate

# Cargar kioscos, tags y códigos de demo
docker exec spot-api pnpm --dir src/apps/api seed
```

### 3. Monitorear logs en tiempo real
```bash
docker compose logs -f
# O filtrar solo por un servicio específico:
docker compose logs -f api
```

### 4. Detener todos los contenedores (liberando memoria)
```bash
docker compose down
```

---

## 🔗 Direcciones de Acceso

* **Desde tu máquina local**: [http://localhost:8081](http://localhost:8081)
* **Desde la red Wi-Fi de tu casa/oficina**: `http://192.168.0.14:8081`
* **Desde el Hotspot compartido de tu Windows**: `http://192.168.137.1:8081`

*Nota: Asegúrate de haber ejecutado las reglas de Firewall de Windows en PowerShell como administrador para habilitar la entrada en los puertos `3001` y `8081`.*
