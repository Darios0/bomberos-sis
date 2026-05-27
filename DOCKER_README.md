# 🐳 BOMBEROS SIS - DOCKER DEPLOYMENT

**Quick Links:**
- 📖 [Full Deployment Guide](DOCKER_DEPLOYMENT.md)
- 🚀 [CentOS 9 Quick Deployment](#quick-deployment)
- 🔒 [Security Notes](#security)
- 🐛 [Troubleshooting](#troubleshooting)

---

## ✨ What's New (v2.0.0)

✅ **Full Docker Containerization** - All services in Docker (DB, App, Nginx)  
✅ **Production-Ready Build** - Multi-stage build, optimized images  
✅ **Security Hardened** - Secrets externalized, no exposed credentials  
✅ **Zero-Downtime Updates** - Rolling deployment with health checks  
✅ **Auto-Restart** - Services restart on boot via systemd  
✅ **Comprehensive Monitoring** - Health checks on all containers  
✅ **Automated Backups** - Daily database backups  

---

## 🚀 Quick Deployment (CentOS 9)

### 1️⃣ **Prepare Deployment Package**
```bash
# On your local machine
git clone https://github.com/Darios0/bomberos-sis.git bomberos-deploy
cd bomberos-deploy
```

### 2️⃣ **Transfer to Server**
```bash
# Replace 192.168.1.100 with your server IP
scp -r . root@192.168.1.100:/tmp/bomberos-sis/
ssh root@192.168.1.100
```

### 3️⃣ **Run Automated Deployment**
```bash
cd /tmp/bomberos-sis
bash docker-deploy.sh
```

**That's it!** The script will:
- ✅ Install Docker + Docker Compose
- ✅ Generate secure DB password & JWT secret
- ✅ Deploy all services
- ✅ Run database migrations
- ✅ Configure firewall
- ✅ Setup auto-restart on boot

---

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CENTOS 9 SERVER                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         DOCKER NETWORK (bomberos_net)            │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │  ┌──────────────┐  ┌──────────────────────────┐ │  │
│  │  │    Nginx     │  │  Node.js + React + Vite │ │  │
│  │  │  :80 :443    │  │      + Express.js       │ │  │
│  │  │ (Reverse     │  │  :3001 (internal only)  │ │  │
│  │  │  Proxy)      │──│                          │ │  │
│  │  └──────────────┘  │  ┌────────────────────┐ │ │  │
│  │                    │  │   Prisma Client    │ │ │  │
│  │                    │  │ + Puppeteer (PDFs) │ │ │  │
│  │                    │  └────────────────────┘ │ │  │
│  │                    └──────────────────────────┘ │  │
│  │                              │                  │  │
│  │  ┌────────────────────────────┴──────────────┐ │  │
│  │  │     PostgreSQL 16 (Database)              │ │  │
│  │  │     :5432 (internal only)                 │ │  │
│  │  │     ├─ bomberos_db                        │ │  │
│  │  │     └─ Data volume: postgres_data         │ │  │
│  │  └───────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Firewall Rules:                                        │
│  ✅ Allow 80 (HTTP)                                    │
│  ✅ Allow 443 (HTTPS)                                  │
│  ❌ Block 3001 (Backend - proxied by Nginx)            │
│  ❌ Block 5432 (Database - internal only)              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|-----------------|
| **Secrets Management** | External `.env` file, never committed |
| **Database Access** | Only accessible from internal Docker network |
| **API Port Isolation** | Port 3001 blocked from external access |
| **Reverse Proxy** | Nginx handles SSL/compression |
| **Firewall** | Only HTTP/HTTPS exposed to internet |
| **User Isolation** | Non-root `bomberos` user for containers |
| **Backups** | Automatic daily database backups |
| **Health Checks** | Continuous service monitoring |

---

## 📁 File Structure

```
bomberos-sis/
├── docker-compose.yml          ← Container orchestration
├── Dockerfile                  ← Multi-stage build (server/)
├── .dockerignore               ← Docker build exclusions
├── .env.example                ← Template (copy to .env)
├── .gitignore                  ← Git exclusions (includes .env)
├── docker-deploy.sh            ← CentOS 9 deployment script
├── update.sh                   ← Safe update script
├── DOCKER_DEPLOYMENT.md        ← Full documentation
├── DOCKER_README.md            ← This file
├── nginx/
│   └── bomberos.conf           ← Nginx configuration
├── server/
│   ├── Dockerfile              ← (via server/Dockerfile)
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   ├── routes/
│   ├── utils/
│   └── index.js
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── ...
│   └── dist/                   ← Built by Dockerfile
└── README.md                   ← Original documentation
```

---

## 🔧 Common Tasks

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f servidor
docker compose logs -f postgres
docker compose logs -f nginx

# Last 50 lines of backend
docker compose logs --tail=50 servidor
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart servidor
docker compose restart nginx

# Rebuild and restart
docker compose up -d --build servidor
```

### Database Operations
```bash
# Connect to database
docker compose exec postgres psql -U bomberos -d bomberos_db

# Backup database
docker compose exec -T postgres pg_dump -U bomberos bomberos_db > backup.sql

# Restore database
docker compose exec -T postgres psql -U bomberos bomberos_db < backup.sql

# View database size
docker compose exec postgres psql -U bomberos -d bomberos_db -c "SELECT pg_size_pretty(pg_database_size('bomberos_db'));"
```

### Update Application
```bash
# Automatic update (handles backups & zero-downtime)
sudo bash /opt/bomberos-sis/update.sh

# Manual update
cd /opt/bomberos-sis
git pull
docker compose build --no-cache
docker compose up -d
```

### Monitor Containers
```bash
# Real-time stats
docker stats

# Container status
docker compose ps

# Check container health
docker compose ps | grep -E "healthy|unhealthy"

# View resource usage
docker system df
```

---

## 🔍 Verification Checklist

After deployment, verify everything is working:

```bash
# ✅ Check services running
docker compose ps
# Should show 3 services as "Up"

# ✅ Check database connection
docker compose exec postgres psql -U bomberos -d bomberos_db -c "SELECT COUNT(*) as tablas FROM information_schema.tables;"

# ✅ Check API health
curl http://localhost/api/health
# Should return: {"status":"ok","mensaje":"Servidor funcionando correctamente"}

# ✅ Check frontend loads
curl http://localhost/ | head -20
# Should return HTML starting with <!DOCTYPE

# ✅ Check logs for errors
docker compose logs | grep -i "error\|warn" | tail -20

# ✅ Check disk usage
docker system df

# ✅ Check firewall
sudo firewall-cmd --list-ports
# Should show nothing (ports blocked)
```

---

## 🚨 Troubleshooting

### Services Not Starting
```bash
# View detailed error
docker compose logs
docker compose logs servidor

# Check system resources
docker stats
free -h
df -h
```

### Database Connection Failed
```bash
# Test database accessibility
docker compose exec postgres psql -U bomberos -d bomberos_db -c "SELECT version();"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# View postgres container logs
docker compose logs postgres
```

### Frontend Not Loading (404 or blank)
```bash
# Check if Nginx is running
docker compose ps | grep nginx

# Test Nginx configuration
docker compose exec nginx nginx -t

# Check if React build exists
docker compose exec nginx ls -la /usr/share/nginx/html/

# View Nginx logs
docker compose logs nginx
```

### Out of Memory or Disk
```bash
# Check disk space
df -h /opt/bomberos-sis

# Check Docker usage
docker system df

# Clean up old images/containers
docker system prune -a
docker volume prune

# Check available memory
free -h
```

---

## 📚 Documentation Files

- **DOCKER_DEPLOYMENT.md** - Complete deployment guide with all details
- **DOCKER_README.md** - This file (quick reference)
- **README.md** - Original project documentation
- **.env.example** - Environment variables template

---

## 🆘 Support

1. **Check logs first:**
   ```bash
   docker compose logs -f
   ```

2. **Review documentation:**
   - See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for detailed troubleshooting

3. **Check GitHub issues:**
   - https://github.com/Darios0/bomberos-sis/issues

4. **Common problems:**
   - Database won't start → Check disk space, restart postgres container
   - Frontend blank → Check browser console, view Nginx logs
   - API timeouts → Increase timeouts in docker-compose.yml
   - Port conflicts → Check `docker ps`, change ports in compose file

---

## 📞 Quick Contact

| Issue | Command |
|-------|---------|
| Check everything | `docker compose ps && docker compose logs --tail=50` |
| Restart all | `docker compose restart` |
| Full reset | `docker compose down && docker compose up -d --build` |
| View DB | `docker compose exec postgres psql -U bomberos bomberos_db` |
| Backup now | `docker compose exec -T postgres pg_dump -U bomberos bomberos_db \| gzip > backup.sql.gz` |

---

**Version:** 2.0.0 (Docker Compose)  
**Updated:** 2026-05-26  
**Status:** ✅ Production Ready
