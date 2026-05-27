#!/bin/sh
echo "=== Iniciando Sistema Bomberos ==="

echo "[1/3] Aplicando migraciones..."
npx prisma migrate deploy

echo "[2/3] Generando cliente Prisma..."
npx prisma generate

echo "[3/3] Iniciando servidor..."
node index.js