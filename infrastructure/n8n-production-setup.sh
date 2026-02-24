#!/bin/bash
set -e

# Production n8n Setup Script
# This script installs n8n with proper disk management, backups, and monitoring
# Run as root or with sudo

echo "======================================"
echo "n8n Production Setup - HappyHub"
echo "======================================"
echo ""

# Variables
N8N_VERSION="latest"
POSTGRES_VERSION="15-alpine"
DATA_DIR="/opt/n8n"
BACKUP_DIR="/opt/backups"
S3_BUCKET="happyhub-n8n-backups"
AWS_REGION="eu-west-1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Update system
log_info "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    unzip \
    jq \
    awscli

# 2. Install Docker
log_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    log_info "Docker installed successfully"
else
    log_info "Docker already installed"
fi

# 3. Install Docker Compose
log_info "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_info "Docker Compose installed successfully"
else
    log_info "Docker Compose already installed"
fi

# 4. Create directory structure
log_info "Creating directory structure..."
mkdir -p ${DATA_DIR}/{n8n-data,postgres-data,nginx/conf.d,nginx/ssl,logs}
mkdir -p ${BACKUP_DIR}

# 5. Generate secure passwords
log_info "Generating secure passwords..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# 6. Create environment file
log_info "Creating environment configuration..."
cat > ${DATA_DIR}/.env <<EOF
# Database Configuration
POSTGRES_USER=n8n
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=n8n

# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=ChangeThisPassword123!
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/

# Execution Configuration
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_MAX_AGE=168

# Generic timezone (recommended for Spain)
GENERIC_TIMEZONE=Europe/Madrid
TZ=Europe/Madrid

# AWS Configuration (for backups)
AWS_DEFAULT_REGION=${AWS_REGION}
EOF

chmod 600 ${DATA_DIR}/.env

# 7. Create Docker Compose file
log_info "Creating Docker Compose configuration..."
cat > ${DATA_DIR}/docker-compose.yml <<'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - n8n-network

  n8n:
    image: n8nio/n8n:latest
    restart: always
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      - N8N_BASIC_AUTH_ACTIVE=${N8N_BASIC_AUTH_ACTIVE}
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=${N8N_PORT}
      - N8N_PROTOCOL=${N8N_PROTOCOL}
      - WEBHOOK_URL=${WEBHOOK_URL}
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=${EXECUTIONS_DATA_SAVE_ON_SUCCESS}
      - EXECUTIONS_DATA_SAVE_ON_ERROR=${EXECUTIONS_DATA_SAVE_ON_ERROR}
      - EXECUTIONS_DATA_MAX_AGE=${EXECUTIONS_DATA_MAX_AGE}
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - TZ=${TZ}
    ports:
      - "5678:5678"
    volumes:
      - ./n8n-data:/home/node/.n8n
      - ./logs:/var/log/n8n
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - n8n-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs:/var/log/nginx
    depends_on:
      - n8n
    networks:
      - n8n-network

networks:
  n8n-network:
    driver: bridge
EOF

# 8. Create Nginx configuration
log_info "Creating Nginx reverse proxy configuration..."
cat > ${DATA_DIR}/nginx/conf.d/n8n.conf <<'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://n8n:5678;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 9. Create backup script
log_info "Creating automated backup script..."
cat > ${BACKUP_DIR}/backup-n8n.sh <<'BACKUP_SCRIPT'
#!/bin/bash
set -e

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="n8n-backup-${BACKUP_DATE}.tar.gz"
DATA_DIR="/opt/n8n"
BACKUP_DIR="/opt/backups"
S3_BUCKET="happyhub-n8n-backups"

# Create backup
echo "[$(date)] Creating backup..."
cd ${DATA_DIR}
tar -czf ${BACKUP_DIR}/${BACKUP_FILE} \
    --exclude='./logs/*' \
    --exclude='./postgres-data/pg_wal/*' \
    .env n8n-data postgres-data

# Upload to S3
echo "[$(date)] Uploading to S3..."
aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE} s3://${S3_BUCKET}/backups/${BACKUP_FILE}

# Keep only last 30 days of local backups
echo "[$(date)] Cleaning old local backups..."
find ${BACKUP_DIR} -name "n8n-backup-*.tar.gz" -mtime +30 -delete

# Keep only last 90 days in S3
echo "[$(date)] Cleaning old S3 backups..."
aws s3 ls s3://${S3_BUCKET}/backups/ | \
    awk '{print $4}' | \
    grep "n8n-backup-" | \
    while read file; do
        file_date=$(echo $file | sed 's/n8n-backup-\([0-9]*\)_.*/\1/')
        days_old=$(( ($(date +%s) - $(date -d "${file_date}" +%s)) / 86400 ))
        if [ $days_old -gt 90 ]; then
            aws s3 rm s3://${S3_BUCKET}/backups/$file
        fi
    done

echo "[$(date)] Backup completed: ${BACKUP_FILE}"
BACKUP_SCRIPT

chmod +x ${BACKUP_DIR}/backup-n8n.sh

# 10. Create cleanup script
log_info "Creating disk cleanup script..."
cat > ${BACKUP_DIR}/cleanup-logs.sh <<'CLEANUP_SCRIPT'
#!/bin/bash
# Clean up old logs and Docker images

# Clean n8n logs older than 7 days
find /opt/n8n/logs -name "*.log" -mtime +7 -delete

# Clean Docker system
docker system prune -af --filter "until=168h"

# Clean old execution data (if n8n CLI is available)
# This is handled by N8N_EXECUTIONS_DATA_MAX_AGE in .env

echo "[$(date)] Cleanup completed"
CLEANUP_SCRIPT

chmod +x ${BACKUP_DIR}/cleanup-logs.sh

# 11. Setup cron jobs
log_info "Setting up automated tasks..."
cat > /etc/cron.d/n8n-maintenance <<'CRON'
# Weekly backup on Sundays at 2 AM
0 2 * * 0 root /opt/backups/backup-n8n.sh >> /var/log/n8n-backup.log 2>&1

# Weekly cleanup on Sundays at 3 AM
0 3 * * 0 root /opt/backups/cleanup-logs.sh >> /var/log/n8n-cleanup.log 2>&1
CRON

# 12. Create monitoring script
log_info "Creating monitoring script..."
cat > /usr/local/bin/n8n-status.sh <<'STATUS_SCRIPT'
#!/bin/bash

echo "======================================"
echo "n8n Status Dashboard"
echo "======================================"
echo ""

# System Resources
echo "=== System Resources ==="
df -h / | tail -1 | awk '{print "Disk Usage: " $3 " / " $2 " (" $5 ")"}'
free -h | grep Mem | awk '{print "Memory Usage: " $3 " / " $2}'
uptime | awk '{print "Load Average: " $(NF-2), $(NF-1), $NF}'
echo ""

# Docker Status
echo "=== Docker Services ==="
cd /opt/n8n
docker-compose ps
echo ""

# n8n Health
echo "=== n8n Health Check ==="
curl -s http://localhost:5678/healthz || echo "n8n not responding"
echo ""

# Recent Logs
echo "=== Recent n8n Logs (last 10 lines) ==="
docker-compose logs --tail=10 n8n
STATUS_SCRIPT

chmod +x /usr/local/bin/n8n-status.sh

# 13. Start services
log_info "Starting n8n services..."
cd ${DATA_DIR}
docker-compose up -d

# 14. Wait for services
log_info "Waiting for services to start..."
sleep 15

# 15. Show status
log_info "Checking service status..."
docker-compose ps

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "n8n is accessible at: http://$(curl -s ifconfig.me):5678"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: ChangeThisPassword123!"
echo ""
echo "⚠️  IMPORTANT: Change the default password immediately!"
echo ""
echo "Configuration files:"
echo "  - Data: ${DATA_DIR}"
echo "  - Backups: ${BACKUP_DIR}"
echo "  - Environment: ${DATA_DIR}/.env"
echo ""
echo "Useful commands:"
echo "  - Status: n8n-status.sh"
echo "  - Logs: cd ${DATA_DIR} && docker-compose logs -f n8n"
echo "  - Restart: cd ${DATA_DIR} && docker-compose restart"
echo "  - Backup: ${BACKUP_DIR}/backup-n8n.sh"
echo ""
echo "Automated tasks:"
echo "  - Weekly backup on Sundays at 2 AM"
echo "  - Weekly cleanup on Sundays at 3 AM"
echo ""
