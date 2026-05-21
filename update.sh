#!/bin/bash
# =============================================================================
# update.sh — Actualizar Bomberos SIS en producción
# Ejecutar como root: bash /opt/bomberos-sis/update.sh
# =============================================================================
set -e

APP_DIR="/opt/bomberos-sis"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${GREEN}=== Actualizando Bomberos SIS ===${NC}"

# Actualizar código (si usas git en el servidor)
# cd "$APP_DIR" && git pull origin main

# Backend: instalar nuevas dependencias y migrar
echo -e "${YELLOW}[1/3] Actualizando backend...${NC}"
cd "$APP_DIR/server"
npm install --omit=dev
npx prisma generate
npx prisma migrate deploy

# Frontend: reconstruir
echo -e "${YELLOW}[2/3] Reconstruyendo frontend...${NC}"
cd "$APP_DIR/client"
npm install
npm run build

# Reiniciar backend
echo -e "${YELLOW}[3/3] Reiniciando backend...${NC}"
pm2 restart bomberos-api

echo -e "${GREEN}Actualización completada.${NC}"
pm2 status
