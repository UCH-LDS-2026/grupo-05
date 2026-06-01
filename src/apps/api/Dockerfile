FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates procps && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/apps/api ./src/apps/api

# Desactivar restricción de antigüedad de pnpm en el contenedor
RUN pnpm config set minimum-release-age 0 && pnpm config set fetch-timeout 300000

RUN pnpm install --frozen-lockfile

# Generar cliente de Prisma
RUN cd src/apps/api && pnpm prisma:generate

EXPOSE 3001

CMD ["pnpm", "--dir", "src/apps/api", "start:dev"]
