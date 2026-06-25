# Spot API — imagen de producción (NestJS + Prisma)
FROM node:20-slim

# openssl/ca-certificates: requeridos por los engines de Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# Manifests del monorepo + código del API
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/apps/api ./src/apps/api

# pnpm en CI/contenedor: sin restricción de antigüedad de paquetes
RUN pnpm config set minimum-release-age 0 && pnpm config set fetch-timeout 300000

RUN pnpm install --frozen-lockfile

# Generar cliente de Prisma y compilar a dist/
RUN cd src/apps/api \
  && pnpm exec prisma generate \
  && pnpm exec nest build

COPY src/apps/api/docker-entrypoint.sh /usr/local/bin/spot-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/spot-entrypoint.sh \
  && chmod +x /usr/local/bin/spot-entrypoint.sh

EXPOSE 3001

# El entrypoint aplica migraciones, hace seed la 1ª vez y arranca el server.
ENTRYPOINT ["/usr/local/bin/spot-entrypoint.sh"]
