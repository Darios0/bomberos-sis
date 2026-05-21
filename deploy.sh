#!/bin/bash
# =============================================================================
# deploy.sh — Despliegue de Bomberos SIS en CentOS 9 Stream
# Ejecutar como root: bash deploy.sh
# =============================================================================
set -e

# ── CONFIGURACIÓN — EDITAR ANTES DE EJECUTAR ──────────────────────────────────
DB_USER="bomberos"
DB_PASS="BomberosIbarra2024!"      # Cambia esta contraseña
DB_NAME="bomberos_db"
JWT_SECRET="jwt_bomberos_ibarra_$(openssl rand -hex 16)"
APP_DIR="/opt/bomberos-sis"
LOG_DIR="/var/log/bomberos"
# ──────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 0. Verificar root ─────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Este script debe ejecutarse como root (sudo bash deploy.sh)"

info "=== Bomberos SIS — Despliegue en CentOS 9 ==="
info "Directorio de aplicación: $APP_DIR"

# ── 1. Actualizar sistema ─────────────────────────────────────────────────────
info "Actualizando sistema..."
dnf update -y -q
dnf install -y -q epel-release curl wget git tar unzip openssl

# ── 2. Instalar Node.js 20 LTS ────────────────────────────────────────────────
info "Instalando Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y -q nodejs
fi
node -v && npm -v
info "Node.js y npm instalados."

# ── 3. Instalar PM2 ───────────────────────────────────────────────────────────
info "Instalando PM2..."
npm install -g pm2 -q
pm2 --version

# ── 4. Instalar PostgreSQL 16 ─────────────────────────────────────────────────
info "Instalando PostgreSQL 16..."
if ! command -v psql &>/dev/null; then
    dnf install -y -q https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
    dnf -qy module disable postgresql
    dnf install -y -q postgresql16-server postgresql16
    /usr/pgsql-16/bin/postgresql-16-setup initdb
    systemctl enable postgresql-16
    systemctl start postgresql-16
    info "PostgreSQL 16 iniciado."
else
    info "PostgreSQL ya instalado."
fi

# ── 5. Crear base de datos y usuario ─────────────────────────────────────────
info "Configurando base de datos..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename='$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
info "Base de datos '$DB_NAME' lista."

# ── 6. Instalar Nginx ─────────────────────────────────────────────────────────
info "Instalando Nginx..."
dnf install -y -q nginx
systemctl enable nginx

# ── 7. Dependencias de sistema para Puppeteer (generación de PDF) ────────────
info "Instalando dependencias de Chromium para Puppeteer..."
dnf install -y -q \
    alsa-lib \
    atk \
    cups-libs \
    gtk3 \
    libX11 \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXfixes \
    libXi \
    libXrandr \
    libXrender \
    libXtst \
    mesa-libgbm \
    nss \
    pango \
    libdrm \
    libxkbcommon \
    xorg-x11-fonts-misc \
    liberation-fonts 2>/dev/null || true

# ── 8. Copiar aplicación ───────────────────────────────────────────────────────
info "Desplegando aplicación en $APP_DIR..."
mkdir -p "$APP_DIR"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
    rsync -a --exclude='node_modules' --exclude='.git' --exclude='client/dist' \
        "$SCRIPT_DIR/" "$APP_DIR/"
fi

# ── 9. Crear directorio de logs ───────────────────────────────────────────────
mkdir -p "$LOG_DIR"

# ── 10. Crear archivo .env del servidor ───────────────────────────────────────
info "Creando archivo .env de producción..."
ENV_FILE="$APP_DIR/server/.env"

if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" <<EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
JWT_SECRET="$JWT_SECRET"
PORT=3001
NODE_ENV=production
EOF
    info "Archivo .env creado en $ENV_FILE"
    info "JWT_SECRET generado automáticamente."
else
    warning ".env ya existe, no se sobreescribe. Verifica que DATABASE_URL sea correcta."
fi

# ── 11. Instalar dependencias del backend ─────────────────────────────────────
info "Instalando dependencias del backend..."
cd "$APP_DIR/server"
npm install --omit=dev

# ── 12. Generar cliente Prisma y ejecutar migraciones ─────────────────────────
info "Ejecutando migraciones de base de datos..."
npx prisma generate
npx prisma migrate deploy

# ── 13. Ejecutar seeds (solo si es despliegue inicial) ────────────────────────
SEED_FLAG="$APP_DIR/.seed_done"
if [ ! -f "$SEED_FLAG" ]; then
    info "Ejecutando seeds iniciales..."
    node seed.js
    node seed-grupos.js
    touch "$SEED_FLAG"
    info "Seeds completados. Usuario admin creado."
    warning "IMPORTANTE: Cambia la contraseña del admin en el primer login."
else
    info "Seeds ya ejecutados anteriormente, omitiendo."
fi

# ── 14. Instalar dependencias del frontend y construir ────────────────────────
info "Construyendo frontend React..."
cd "$APP_DIR/client"
npm install
npm run build
info "Frontend construido en $APP_DIR/client/dist"

# ── 15. Configurar Nginx ───────────────────────────────────────────────────────
info "Configurando Nginx..."
cp "$APP_DIR/nginx/bomberos.conf" /etc/nginx/conf.d/bomberos.conf

# Deshabilitar config por defecto si existe
if [ -f /etc/nginx/conf.d/default.conf ]; then
    mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled
fi

nginx -t && systemctl restart nginx
info "Nginx configurado y reiniciado."

# ── 16. Iniciar backend con PM2 ───────────────────────────────────────────────
info "Iniciando backend con PM2..."
cd "$APP_DIR/server"

pm2 delete bomberos-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
info "Backend corriendo con PM2."

# ── 17. Configurar firewalld ───────────────────────────────────────────────────
info "Configurando firewall (solo red local)..."
if systemctl is-active --quiet firewalld; then
    # Abrir HTTP solo en zona interna
    firewall-cmd --permanent --zone=internal --add-service=http
    firewall-cmd --permanent --zone=public --remove-service=http 2>/dev/null || true
    firewall-cmd --permanent --zone=public --remove-service=https 2>/dev/null || true

    # Bloquear puerto 3001 (solo acceso via Nginx)
    firewall-cmd --permanent --zone=public --remove-port=3001/tcp 2>/dev/null || true

    firewall-cmd --reload
    info "Firewall configurado. Puerto 80 disponible solo en zona interna."
else
    warning "firewalld no está activo. Actívalo con: systemctl enable --now firewalld"
fi

# ── 18. SELinux: permitir Nginx conectar al backend ───────────────────────────
if command -v setsebool &>/dev/null; then
    info "Configurando SELinux para Nginx..."
    setsebool -P httpd_can_network_connect 1
fi

# ── Resumen ───────────────────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Bomberos SIS desplegado exitosamente${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  URL de acceso (red local):  ${YELLOW}http://$SERVER_IP${NC}"
echo -e "  Logs del backend:           ${YELLOW}pm2 logs bomberos-api${NC}"
echo -e "  Estado del backend:         ${YELLOW}pm2 status${NC}"
echo -e "  Logs de Nginx:              ${YELLOW}tail -f /var/log/nginx/bomberos-error.log${NC}"
echo ""
echo -e "${YELLOW}  CREDENCIALES INICIALES:${NC}"
echo -e "  Email:    admin@bomberosibarra.gob.ec"
echo -e "  Password: admin123  ← CAMBIAR AL PRIMER LOGIN"
echo ""
echo -e "  Para actualizar la app en el futuro: ${YELLOW}bash $APP_DIR/update.sh${NC}"
echo ""
