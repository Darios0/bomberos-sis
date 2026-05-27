# 🐳 BOMBEROS SIS - DOCKER DEPLOYMENT GUIDE

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Local Development with Docker](#local-development)
- [CentOS 9 Server Deployment](#centos-9-deployment)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Quick Start

### Local Development (Windows/Mac/Linux)

```bash
# 1. Clone repository
git clone https://github.com/Darios0/bomberos-sis.git
cd bomberos-sis

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your local values
# Use simple passwords for local development
DB_PASSWORD=localdev123
JWT_SECRET=dev_secret_key_for_local_testing_only

# 4. Build and start
docker compose up --build

# 5. Access application
# Frontend: http://localhost
# Backend API: http://localhost/api
# Adminer (optional DB tool): http://localhost:8080
```

---

## Prerequisites

### System Requirements

**CentOS 9 Server:**
```
- Minimum 2GB RAM (4GB recommended)
- 20GB free disk space (50GB for backups)
- Linux Kernel 4.x or higher
- Internet connectivity for Docker image downloads
```

### Required Tools (automatically installed by docker-deploy.sh)
- Docker 24.x+
- Docker Compose 2.x+
- curl, wget, openssl

---

## Local Development

### Option 1: Using docker-compose (Recommended)

```bash
# Start all services
docker compose up --build

# In another terminal, seed database
docker compose exec servidor node seed.js
docker compose exec servidor node seed-grupos.js

# Stop services
docker compose down
```

**Services available:**
- PostgreSQL: `localhost:5432`
- Backend API: `localhost:3001`
- Frontend (via Nginx): `localhost:80` or `localhost`

### Option 2: Manual Build and Run

```bash
# Build image
docker build -f server/Dockerfile -t bomberos-app:latest .

# Run with network
docker network create bomberos_net

docker run -d \
  --name bomberos-db \
  --network bomberos_net \
  -e POSTGRES_PASSWORD=dev123 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

docker run -d \
  --name bomberos-app \
  --network bomberos_net \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://postgres:dev123@bomberos-db:5432/bomberos_db" \
  -e JWT_SECRET="dev_secret" \
  bomberos-app:latest
```

---

## CentOS 9 Deployment

### Automated Deployment (Recommended)

**On your local machine:**

```bash
# 1. Prepare deployment files
git clone https://github.com/Darios0/bomberos-sis.git bomberos-deploy
cd bomberos-deploy

# 2. Transfer to CentOS server
scp -r . root@your-centos-server:/tmp/bomberos-sis/
```

**On CentOS 9 Server:**

```bash
# 3. Run deployment script as root
cd /tmp/bomberos-sis
sudo bash docker-deploy.sh
```

**What the script does:**
- ✅ Installs Docker and Docker Compose
- ✅ Creates application user (`bomberos`)
- ✅ Generates secure passwords (DB + JWT)
- ✅ Deploys application to `/opt/bomberos-sis`
- ✅ Configures firewall (only HTTP/HTTPS exposed)
- ✅ Sets up auto-restart on boot
- ✅ Creates database and runs migrations
- ✅ Enables health checks

### Manual Deployment (if needed)

```bash
# 1. Install Docker
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 2. Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# 3. Create app directory
sudo mkdir -p /opt/bomberos-sis
sudo cd /opt/bomberos-sis

# 4. Copy code (via scp or git)
sudo git clone https://github.com/Darios0/bomberos-sis.git .

# 5. Create .env
sudo cp .env.example .env
sudo nano .env  # Edit with secure values
sudo chmod 600 .env

# 6. Build and start
sudo docker compose up -d --build

# 7. Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --remove-port=3001/tcp
sudo firewall-cmd --permanent --remove-port=5432/tcp
sudo firewall-cmd --reload
```

---

## Post-Deployment

### Verify Installation

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f servidor

# Test API
curl http://localhost/api/health
# Expected response: {"status":"ok","mensaje":"Servidor funcionando correctamente"}

# Access web interface
# Open browser: http://<server-ip>
```

### Initial Configuration

1. **Log in with default credentials:**
   - Email: `admin@bomberosibarra.gob.ec`
   - Password: `admin123`

2. **IMMEDIATELY change password:**
   - Click "Mi Perfil" (My Profile)
   - Change password to something secure

3. **Configure server domain (if needed):**
   - Edit `/opt/bomberos-sis/nginx/bomberos.conf`
   - Update `server_name` for SSL certificates
   - Restart Nginx: `docker compose restart nginx`

### Backup Database

```bash
# Manual backup
docker compose exec postgres pg_dump -U bomberos bomberos_db > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T postgres psql -U bomberos bomberos_db < backup_20260526.sql
```

---

## Environment Variables

### .env File Format

```env
# Database configuration
DB_USER=bomberos                          # PostgreSQL username
DB_PASSWORD=YourSecurePassword123!@#     # Must be 16+ chars (change!)
DB_NAME=bomberos_db                       # Database name

# Application
NODE_ENV=production                       # Don't change
PORT=3001                                 # Internal port (not exposed)
JWT_SECRET=your_strong_random_jwt_secret # Generate: openssl rand -hex 32

# Logging
LOG_LEVEL=info                           # debug|info|warn|error
```

### Generating Secure Values

```bash
# Generate DB password (20 chars, safe for shell)
openssl rand -base64 16 | tr -d '=' | cut -c1-20

# Generate JWT secret (64 chars hex)
openssl rand -hex 32
```

---

## Docker Images

### Multi-Stage Build

The Dockerfile uses multi-stage build to minimize image size:

1. **frontend-builder** - Compiles React with Vite
2. **backend-builder** - Installs Node.js dependencies
3. **production** - Final image (~450MB)

### Build Command

```bash
docker compose build --no-cache
```

### Push to Registry (Optional)

```bash
docker tag bomberos-app:latest your-registry/bomberos:1.0.0
docker push your-registry/bomberos:1.0.0
```

---

## Troubleshooting

### Containers not starting

```bash
# Check logs
docker compose logs

# Specific service
docker compose logs servidor
docker compose logs postgres
docker compose logs nginx

# See last 50 lines
docker compose logs --tail=50 -f
```

### Database connection failed

```bash
# Check if database is healthy
docker compose ps | grep postgres

# Test database connection
docker compose exec postgres psql -U bomberos -d bomberos_db -c "SELECT version();"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Application not accessible

```bash
# Check if Nginx is running
docker compose ps | grep nginx

# Test Nginx
docker compose exec nginx nginx -t

# Check Nginx logs
docker compose logs nginx

# Verify firewall
sudo firewall-cmd --list-ports
sudo firewall-cmd --list-services
```

### Memory or disk space issues

```bash
# Check disk usage
docker system df

# Clean up unused images
docker image prune -a

# Clean up volumes
docker volume prune

# Check available disk
df -h /opt/bomberos-sis
```

### Reset Everything (Warning: Destructive)

```bash
# Stop all services
docker compose down

# Remove volumes (data WILL be lost)
docker volume rm bomberos-sis_postgres_data

# Remove images
docker compose down --rmi all

# Start fresh
docker compose up --build -d
```

---

## Maintenance

### Updating the Application

```bash
# Stop services
docker compose down

# Pull latest code
git pull

# Rebuild images
docker compose build --no-cache

# Start services
docker compose up -d

# Check migrations ran
docker compose logs servidor | grep -i "migrat"
```

### Regular Backups

```bash
# Create backup script
cat > /opt/bomberos-sis/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/bomberos"
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U bomberos bomberos_db | \
  gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"
echo "Backup created: backup_$DATE.sql.gz"
EOF

chmod +x /opt/bomberos-sis/backup.sh

# Schedule with crontab
# (0 2 * * * /opt/bomberos-sis/backup.sh) - runs daily at 2 AM
```

### Monitor Container Health

```bash
# Watch real-time stats
docker stats

# Health check status
docker compose ps

# View health logs
docker compose exec servidor wget -O- http://localhost:3001/api/health
```

### Log Rotation

Docker Compose logs are stored in volumes. Set limits in `docker-compose.yml`:

```yaml
services:
  servidor:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
```

---

## Security Best Practices

### ✅ Do:
- Keep `.env` with mode 600 (owner read-only)
- Use strong passwords (16+ chars, mixed case, numbers, symbols)
- Rotate JWT_SECRET periodically
- Keep Docker images updated: `docker pull postgres:16-alpine`
- Use firewall rules (only expose HTTP/HTTPS)
- Enable SELinux on CentOS
- Backup database daily
- Monitor logs for errors

### ❌ Don't:
- Commit `.env` to version control
- Share credentials via email or chat
- Run containers as root
- Expose port 3001 or 5432 to internet
- Use default passwords
- Trust self-signed certificates in production
- Keep sensitive logs accessible to non-admins

### Firewall Configuration

```bash
# Only allow from trusted IPs (example)
firewall-cmd --permanent --zone=trusted --add-source=192.168.1.0/24
firewall-cmd --permanent --zone=trusted --add-service=http
firewall-cmd --permanent --zone=trusted --add-service=https

# Block everything else
firewall-cmd --permanent --zone=public --remove-service=http
firewall-cmd --permanent --zone=public --remove-service=https
firewall-cmd --reload
```

---

## Advanced: Multiple Environments

### Dev, Staging, Production

```bash
# Create separate env files
.env.dev
.env.staging
.env.production

# Use with environment flag
docker compose --env-file .env.production up -d

# Or create separate compose files
docker-compose.dev.yml
docker-compose.prod.yml

# Use specific compose file
docker compose -f docker-compose.prod.yml up -d
```

---

## Support & Documentation

- **GitHub Issues:** [Darios0/bomberos-sis/issues](https://github.com/Darios0/bomberos-sis/issues)
- **Docker Docs:** https://docs.docker.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Express.js Docs:** https://expressjs.com/
- **React Docs:** https://react.dev/

---

## Version History

- **v2.0.0** (2026-05-26) - Docker Compose rewrite with Nginx containerization
- **v1.0.0** - Original PM2-based deployment

