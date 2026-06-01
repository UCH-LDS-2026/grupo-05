FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/apps/app ./src/apps/app

# Desactivar restricción de antigüedad de pnpm en el contenedor
RUN pnpm config set minimum-release-age 0

RUN pnpm install --frozen-lockfile

EXPOSE 8081

CMD ["pnpm", "--dir", "src/apps/app", "web"]
