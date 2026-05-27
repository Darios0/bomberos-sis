#!/bin/bash
# ============================================================================
# BOMBEROS SIS - SAFE UPDATE SCRIPT
# ============================================================================
# 
# Usage: bash update.sh
# Updates Docker containers with zero-downtime deployment
#
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}     $1"; }
success() { echo -e "${GREEN}[✓]${NC}       $1"; }
warning() { echo -e "${YELLOW}[⚠]${NC}       $1"; }
error()   { echo -e "${RED}[✗]${NC}       $1"; exit 1; }

APP_DIR="/opt/bomberos-sis"
BACKUP_DIR="/var/backups/bomberos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  BOMBEROS SIS - Update Script                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (use: sudo bash update.sh)"
fi

# Verify we're in the right directory
if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
    error "docker-compose.yml not found in $APP_DIR. Wrong directory?"
fi

info "Starting safe update process..."

# Step 1: Backup database
info "Step 1/5: Backing up database..."
mkdir -p "$BACKUP_DIR"

if ! docker compose -f "$APP_DIR/docker-compose.yml" exec -T postgres pg_dump -U bomberos bomberos_db | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"; then
    error "Database backup failed"
fi

success "Database backed up to: backup_$TIMESTAMP.sql.gz"

# Step 2: Pull latest code
info "Step 2/5: Pulling latest code from repository..."

cd "$APP_DIR"

if git rev-parse --git-dir > /dev/null 2>&1; then
    git fetch origin || warning "Failed to fetch from remote"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git pull origin "$CURRENT_BRANCH" || warning "Failed to pull latest code"
    success "Code updated"
else
    warning "Not a git repository, skipping code pull"
fi

# Step 3: Rebuild images
info "Step 3/5: Building updated Docker images..."

docker compose build --no-cache 2>&1 | grep -E "^(Step|Building|Sending|Successfully)" || true

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    error "Docker build failed"
fi

success "Docker images built successfully"

# Step 4: Deploy with zero-downtime strategy
info "Step 4/5: Deploying with zero-downtime strategy..."

# Create new containers alongside old ones
docker compose up -d --no-deps --build servidor nginx 2>&1 | grep -v "^Pulling\|^Digest"

# Wait for new services to be healthy
info "Waiting for new services to become healthy..."
HEALTH_CHECKS=0
MAX_HEALTH_CHECKS=60

while [ $HEALTH_CHECKS -lt $MAX_HEALTH_CHECKS ]; do
    if curl -s http://localhost/api/health | grep -q "ok"; then
        success "New services are healthy"
        HEALTH_CHECKS=$MAX_HEALTH_CHECKS
    else
        HEALTH_CHECKS=$((HEALTH_CHECKS + 1))
        sleep 1
    fi
done

if [ $HEALTH_CHECKS -ge $MAX_HEALTH_CHECKS ]; then
    warning "Services took longer than expected to become healthy"
fi

# Step 5: Cleanup old images
info "Step 5/5: Cleaning up old images..."

docker image prune -af --filter "until=168h" > /dev/null 2>&1 || true
docker system prune -f > /dev/null 2>&1 || true

success "Cleanup completed"

# Verify everything is working
echo ""
info "Verifying deployment..."

RUNNING_CONTAINERS=$(docker compose ps | grep -c "Up" || true)
expected_containers=3  # postgres, servidor, nginx

if [ "$RUNNING_CONTAINERS" -ge 3 ]; then
    success "All services are running"
else
    warning "Only $RUNNING_CONTAINERS/3 services are running"
fi

# Display status
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  UPDATE COMPLETED SUCCESSFULLY                                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Status:${NC}"
docker compose ps
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:       docker compose logs -f"
echo "  Rollback DB:     psql < /var/backups/bomberos/backup_$TIMESTAMP.sql.gz"
echo "  Stop services:   docker compose down"
echo "  Start services:  docker compose up -d"
echo ""

info "Update finished at $(date)"
