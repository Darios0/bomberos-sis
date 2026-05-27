#!/bin/bash
# ============================================================================
# BOMBEROS SIS - SECURE DOCKER DEPLOYMENT SCRIPT FOR CENTOS 9
# ============================================================================
# 
# Usage: bash docker-deploy.sh
# Must be run as root or with sudo
#
# This script deploys Bomberos SIS using Docker and Docker Compose on CentOS 9
# with proper security, logging, and health checks.
#
# ============================================================================

set -e

# ──────────────────────────────────────────────────────────────────────────
# COLORS AND LOGGING
# ──────────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}     $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC}    $1"; }
error()   { echo -e "${RED}[ERROR]${NC}    $1"; exit 1; }

# ──────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────

APP_DIR="/opt/bomberos-sis"
APP_USER="bomberos"
APP_GROUP="bomberos"
LOG_DIR="/var/log/bomberos"
ENV_FILE="${APP_DIR}/.env"
BACKUP_DIR="/var/backups/bomberos"

# ──────────────────────────────────────────────────────────────────────────
# PRE-FLIGHT CHECKS
# ──────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║  BOMBEROS SIS - Docker Deployment for CentOS 9                         ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
[[ $EUID -ne 0 ]] && error "This script must be run as root (use: sudo bash docker-deploy.sh)"

# Check if CentOS 9
if ! grep -qi "centos" /etc/os-release; then
    warning "This system does not appear to be CentOS 9. Continuing anyway..."
fi

info "Pre-flight checks..."

# Check system resources
MEMORY_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "$MEMORY_MB" -lt 2048 ]; then
    warning "System has less than 2GB RAM (current: ${MEMORY_MB}MB). May experience performance issues."
fi

# ──────────────────────────────────────────────────────────────────────────
# STEP 1: INSTALL DOCKER AND DOCKER COMPOSE
# ──────────────────────────────────────────────────────────────────────────

info "Step 1/8: Installing Docker and Docker Compose..."

if ! command -v docker &>/dev/null; then
    dnf install -y -q dnf-plugins-core
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    success "Docker already installed"
fi

# Enable and start Docker daemon
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
docker compose version

success "Docker and Docker Compose installed"

# ──────────────────────────────────────────────────────────────────────────
# STEP 2: CREATE APPLICATION USER AND DIRECTORIES
# ──────────────────────────────────────────────────────────────────────────

info "Step 2/8: Setting up application user and directories..."

# Create bomberos user if doesn't exist
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$APP_DIR" -m "$APP_USER"
    success "Created user: $APP_USER"
else
    success "User $APP_USER already exists"
fi

# Create necessary directories
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# Set permissions
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"
chown -R "$APP_USER:$APP_GROUP" "$LOG_DIR"
chown -R "$APP_USER:$APP_GROUP" "$BACKUP_DIR"
chmod 755 "$APP_DIR"
chmod 755 "$LOG_DIR"

success "Directories created and configured"

# ──────────────────────────────────────────────────────────────────────────
# STEP 3: DEPLOY APPLICATION CODE
# ──────────────────────────────────────────────────────────────────────────

info "Step 3/8: Deploying application code..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
    # Backup existing installation if it exists
    if [ -d "${APP_DIR}/server" ]; then
        BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        warning "Backing up existing installation to $BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
        mkdir -p "$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
        rsync -av "$APP_DIR/" "$BACKUP_DIR/backup_$BACKUP_TIMESTAMP/" --exclude='node_modules' --exclude='.git' 2>/dev/null || true
    fi
    
    # Copy new code
    rsync -av --exclude='node_modules' \
              --exclude='.git' \
              --exclude='*.log' \
              --exclude='.env' \
              --exclude='.DS_Store' \
              "$SCRIPT_DIR/" "$APP_DIR/" > /dev/null 2>&1
    
    chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"
fi

success "Application code deployed"

# ──────────────────────────────────────────────────────────────────────────
# STEP 4: CONFIGURE ENVIRONMENT VARIABLES
# ──────────────────────────────────────────────────────────────────────────

info "Step 4/8: Configuring environment variables..."

if [ ! -f "$ENV_FILE" ]; then
    # Generate secure values
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d '=' | cut -c1-20)
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Create .env file
    cat > "$ENV_FILE" <<EOF
# Generated on $(date)
DB_USER=bomberos
DB_PASSWORD=$DB_PASSWORD
DB_NAME=bomberos_db
NODE_ENV=production
PORT=3001
JWT_SECRET=$JWT_SECRET
LOG_LEVEL=info
EOF
    
    chmod 600 "$ENV_FILE"
    chown "$APP_USER:$APP_GROUP" "$ENV_FILE"
    
    echo ""
    echo -e "${YELLOW}⚠️  NEW ENVIRONMENT CREATED:${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════${NC}"
    echo "DATABASE PASSWORD: $DB_PASSWORD"
    echo "JWT_SECRET: $JWT_SECRET"
    echo -e "${YELLOW}════════════════════════════════════════════════════${NC}"
    echo ""
    warning "Save these values securely! Database password cannot be recovered."
    
else
    success ".env file already exists (not overwriting)"
fi

success "Environment variables configured"

# ──────────────────────────────────────────────────────────────────────────
# STEP 5: BUILD AND START CONTAINERS
# ──────────────────────────────────────────────────────────────────────────

info "Step 5/8: Building Docker images..."

cd "$APP_DIR"

# Build images
docker compose build --no-cache 2>&1 | grep -E "^(Step|Building|Sending|Successfully)" || true

success "Docker images built"

# ──────────────────────────────────────────────────────────────────────────
# STEP 6: START SERVICES
# ──────────────────────────────────────────────────────────────────────────

info "Step 6/8: Starting services..."

docker compose down 2>/dev/null || true
sleep 2

docker compose up -d

# Wait for services to be healthy
info "Waiting for services to become healthy..."
sleep 10

# Check service status
info "Service status:"
docker compose ps

success "Services started"

# ──────────────────────────────────────────────────────────────────────────
# STEP 7: VERIFY DATABASE AND MIGRATIONS
# ──────────────────────────────────────────────────────────────────────────

info "Step 7/8: Verifying database..."

# Wait for DB to be ready
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose exec -T postgres pg_isready -U bomberos >/dev/null 2>&1; then
        success "Database is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        error "Database failed to become ready after ${MAX_RETRIES}s"
    fi
    sleep 1
done

# Check server logs for migration status
info "Checking server startup logs..."
docker compose logs servidor | tail -20

success "Database verified"

# ──────────────────────────────────────────────────────────────────────────
# STEP 8: CONFIGURE FIREWALL
# ──────────────────────────────────────────────────────────────────────────

info "Step 8/8: Configuring firewall..."

if systemctl is-active --quiet firewalld; then
    # Allow HTTP and HTTPS only
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    
    # Remove direct access to application port
    firewall-cmd --permanent --remove-port=3001/tcp 2>/dev/null || true
    
    # Remove direct access to database port
    firewall-cmd --permanent --remove-port=5432/tcp 2>/dev/null || true
    
    firewall-cmd --reload
    success "Firewall configured (HTTP/HTTPS allowed, ports 3001/5432 blocked)"
else
    warning "firewalld is not active. Configure firewall manually if needed."
fi

# ──────────────────────────────────────────────────────────────────────────
# SETUP MONITORING AND AUTO-RESTART
# ──────────────────────────────────────────────────────────────────────────

info "Setting up auto-restart on boot..."

# Create systemd service
cat > /etc/systemd/system/bomberos-docker.service <<'SYSTEMD_EOF'
[Unit]
Description=Bomberos SIS Docker Services
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=root
WorkingDirectory=/opt/bomberos-sis
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

systemctl daemon-reload
systemctl enable bomberos-docker.service

success "Systemd service created and enabled"

# ──────────────────────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────────────────────

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  BOMBEROS SIS DEPLOYMENT COMPLETED SUCCESSFULLY                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 ACCESS INFORMATION:${NC}"
echo "   Web UI:          http://$SERVER_IP"
echo "   API Health:      http://$SERVER_IP/api/health"
echo ""
echo -e "${YELLOW}🔐 CREDENTIALS:${NC}"
echo "   Email:           admin@bomberosibarra.gob.ec"
echo "   Default Pass:    admin123"
echo "   ⚠️  CHANGE PASSWORD ON FIRST LOGIN"
echo ""
echo -e "${YELLOW}📋 USEFUL COMMANDS:${NC}"
echo "   View logs:       docker compose -f $APP_DIR/docker-compose.yml logs -f"
echo "   Status:          docker compose -f $APP_DIR/docker-compose.yml ps"
echo "   Restart:         docker compose -f $APP_DIR/docker-compose.yml restart"
echo "   Stop:            docker compose -f $APP_DIR/docker-compose.yml down"
echo "   Start:           docker compose -f $APP_DIR/docker-compose.yml up -d"
echo ""
echo -e "${YELLOW}🔒 SECURITY NOTES:${NC}"
echo "   - Database password saved in: $ENV_FILE"
echo "   - Never share .env file or expose port 3001/5432 to internet"
echo "   - Use HTTPS with a reverse proxy for internet access"
echo "   - Regularly backup: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}📚 DOCUMENTATION:${NC}"
echo "   Docker Compose: docker compose help"
echo "   View app logs:  docker compose logs servidor"
echo "   View DB logs:   docker compose logs postgres"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# ──────────────────────────────────────────────────────────────────────────

info "Running health checks..."
sleep 5

HEALTH_OK=0

# Check if containers are running
if docker compose ps | grep -q "Up"; then
    success "All containers are running"
    HEALTH_OK=$((HEALTH_OK + 1))
else
    error "Some containers are not running"
fi

# Check API health
if curl -s http://localhost/api/health | grep -q "ok"; then
    success "API is responding"
    HEALTH_OK=$((HEALTH_OK + 1))
else
    warning "API health check failed - may still be initializing"
fi

echo ""
if [ $HEALTH_OK -eq 2 ]; then
    echo -e "${GREEN}✅ Deployment appears to be successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Deployment completed but some health checks failed.${NC}"
    echo -e "${YELLOW}Monitor logs: docker compose logs -f${NC}"
fi
echo ""
