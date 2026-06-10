#!/bin/sh
# Arranque del contenedor del API: deja la base lista y levanta el server.
# Idempotente: las migraciones se aplican siempre; el seed corre solo si la
# base está vacía (primera vez), para no pisar datos en cada reinicio.
set -e

cd /app/src/apps/api

echo "📦 Aplicando migraciones (prisma migrate deploy)..."
pnpm exec prisma migrate deploy

echo "🔎 Verificando si la base tiene datos..."
KIOSK_COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.kiosk.count().then(c=>console.log(c)).catch(()=>console.log(-1)).finally(()=>p.\$disconnect())")

if [ "$KIOSK_COUNT" = "0" ]; then
  echo "🌱 Base vacía → cargando datos de demo (seed)..."
  pnpm seed
else
  echo "✅ Base con datos (kioscos=$KIOSK_COUNT) → salteo el seed."
fi

echo "🚀 Iniciando Spot API..."
exec node dist/src/main.js
