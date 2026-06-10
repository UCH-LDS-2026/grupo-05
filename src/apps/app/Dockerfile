# Spot App (Expo Web) — build estático servido con `serve`
FROM node:20-alpine

RUN npm install -g pnpm serve

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/apps/app ./src/apps/app

RUN pnpm config set minimum-release-age 0

RUN pnpm install --frozen-lockfile

# URL del API horneada en el bundle. En runtime, si se accede por IP de LAN,
# lib/api.ts la recalcula desde el hostname del navegador (ver el archivo).
ARG EXPO_PUBLIC_API_URL=http://localhost:3001
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Export web estático (SPA, web.output = "single") → src/apps/app/dist
RUN cd src/apps/app && pnpm exec expo export -p web --output-dir dist

EXPOSE 8081

# -s: fallback SPA (todas las rutas → index.html). Estático, sin dev server.
CMD ["serve", "-s", "/app/src/apps/app/dist", "-l", "8081"]
