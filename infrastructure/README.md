# n8n Production Infrastructure Setup

Complete guide for deploying a production-ready n8n instance on AWS EC2.

## Features

✅ **Reliability**
- Docker Compose with PostgreSQL database
- Automatic restart on failure
- Data persistence across container restarts
- Health checks and monitoring

✅ **Backup & Recovery**
- Automated daily backups to S3
- 30-day local backup retention
- 90-day S3 backup retention
- Easy restore process

✅ **Disk Management**
- 30GB gp3 volume (vs 20GB before)
- Automated log cleanup
- Docker system pruning
- Execution data retention policies

✅ **Security**
- Basic auth enabled by default
- Security group with minimal ports
- Encrypted environment variables
- SSH key-based access

✅ **Monitoring**
- Status dashboard script
- CloudWatch metrics (future)
- Docker health checks
- Log rotation

## Prerequisites

1. **AWS CLI configured** with `happyhub-cli` profile
2. **SSH key** for EC2 access
3. **S3 bucket** for backups (will be created)

## Quick Start

### Step 1: Terminate Old Instance (if exists)

```bash
# Check current instance
aws ec2 describe-instances \
  --instance-ids i-00e6ad6229322f4f3 \
  --profile happyhub-cli \
  --region eu-west-1

# Terminate it
aws ec2 terminate-instances \
  --instance-ids i-00e6ad6229322f4f3 \
  --profile happyhub-cli \
  --region eu-west-1
```

### Step 2: Create S3 Backup Bucket

```bash
aws s3 mb s3://happyhub-n8n-backups \
  --profile happyhub-cli \
  --region eu-west-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket happyhub-n8n-backups \
  --versioning-configuration Status=Enabled \
  --profile happyhub-cli \
  --region eu-west-1
```

### Step 3: Launch New EC2 Instance

```bash
cd infrastructure
chmod +x launch-n8n-ec2.sh
./launch-n8n-ec2.sh
```

This will:
- Create a t3.small instance (2 vCPU, 2GB RAM)
- Attach a 30GB gp3 volume
- Configure security groups (ports 22, 80, 443, 5678)
- Create SSH key pair
- Output connection details

### Step 4: Install n8n

```bash
# Get the public IP from previous step output
PUBLIC_IP="<from-step-3-output>"

# Upload setup script
scp -i ~/.ssh/n8n-happyhub-key.pem \
    n8n-production-setup.sh \
    ubuntu@${PUBLIC_IP}:~/

# SSH into instance
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@${PUBLIC_IP}

# Run setup (takes 3-5 minutes)
sudo bash n8n-production-setup.sh
```

### Step 5: Access n8n

Open browser: `http://<PUBLIC_IP>:5678`

**Default credentials:**
- Username: `admin`
- Password: `ChangeThisPassword123!`

⚠️ **IMPORTANT:** Change the password immediately after first login!

## Post-Installation

### Change Password

1. Edit `/opt/n8n/.env`:
   ```bash
   sudo nano /opt/n8n/.env
   ```

2. Update:
   ```
   N8N_BASIC_AUTH_PASSWORD=YourSecurePassword
   ```

3. Restart:
   ```bash
   cd /opt/n8n
   sudo docker-compose restart n8n
   ```

### Import Workflows

```bash
# Option 1: Via UI (recommended)
# Go to Workflows → Import from File → Select JSON

# Option 2: Copy files directly
scp -i ~/.ssh/n8n-happyhub-key.pem \
    n8n/n8n-nodes/*.json \
    ubuntu@${PUBLIC_IP}:/tmp/

# Then import via n8n UI
```

### Configure Webhook URL

1. Get public IP: `curl ifconfig.me`
2. Update in n8n settings:
   - Webhook URL: `http://<PUBLIC_IP>:5678/`
3. Update in HappyHub code:
   - `N8N_WEBHOOK_URL=http://<PUBLIC_IP>:5678/webhook/reservation-request`

## Maintenance

### Check Status

```bash
# SSH into instance
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@<PUBLIC_IP>

# Run status dashboard
sudo n8n-status.sh
```

### View Logs

```bash
# n8n logs
cd /opt/n8n
sudo docker-compose logs -f n8n

# All services
sudo docker-compose logs -f

# Last 100 lines
sudo docker-compose logs --tail=100
```

### Manual Backup

```bash
sudo /opt/backups/backup-n8n.sh
```

### Restore from Backup

```bash
# List available backups
aws s3 ls s3://happyhub-n8n-backups/backups/ \
  --profile happyhub-cli \
  --region eu-west-1

# Download backup
aws s3 cp s3://happyhub-n8n-backups/backups/n8n-backup-YYYYMMDD_HHMMSS.tar.gz \
  /tmp/restore.tar.gz \
  --profile happyhub-cli \
  --region eu-west-1

# Stop services
cd /opt/n8n
sudo docker-compose down

# Restore
cd /opt/n8n
sudo tar -xzf /tmp/restore.tar.gz

# Start services
sudo docker-compose up -d
```

### Restart Services

```bash
cd /opt/n8n
sudo docker-compose restart        # Restart all
sudo docker-compose restart n8n    # Restart only n8n
```

### Update n8n

```bash
cd /opt/n8n

# Backup first!
sudo /opt/backups/backup-n8n.sh

# Pull latest images
sudo docker-compose pull

# Restart with new images
sudo docker-compose up -d
```

## Monitoring & Alerts

### Disk Space Alert

```bash
# Check disk usage
df -h /

# If > 80%, clean up:
sudo /opt/backups/cleanup-logs.sh
sudo docker system prune -af
```

### Memory Usage

```bash
# Check memory
free -h

# If high, restart services:
cd /opt/n8n
sudo docker-compose restart
```

## Troubleshooting

### n8n Not Responding

```bash
# Check if running
cd /opt/n8n
sudo docker-compose ps

# Check logs
sudo docker-compose logs n8n

# Restart
sudo docker-compose restart n8n
```

### Database Connection Error

```bash
# Check PostgreSQL
sudo docker-compose logs postgres

# Restart both
sudo docker-compose restart postgres n8n
```

### Webhook Not Working

1. Check firewall/security group (port 5678 open)
2. Verify `WEBHOOK_URL` in `/opt/n8n/.env`
3. Test webhook: `curl http://<PUBLIC_IP>:5678/healthz`

### Out of Disk Space

```bash
# Clean logs
sudo find /opt/n8n/logs -type f -mtime +7 -delete

# Clean Docker
sudo docker system prune -af --volumes

# Clean old backups
sudo find /opt/backups -name "*.tar.gz" -mtime +30 -delete
```

## Cost Breakdown

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| EC2 t3.small | 2 vCPU, 2GB RAM | ~€15 |
| EBS gp3 | 30GB, 3000 IOPS | ~€3 |
| S3 backups | ~10GB | ~€0.25 |
| Data transfer | ~5GB/month | ~€0.50 |
| **Total** | | **~€19/month** |

## Security Best Practices

1. **Change default password** immediately
2. **Use SSH keys only** (disable password auth)
3. **Keep n8n updated** monthly
4. **Review security group rules** quarterly
5. **Rotate credentials** annually
6. **Monitor access logs** weekly
7. **Test backups** monthly

## Upgrade Path

When you need more capacity:

```bash
# Stop services
cd /opt/n8n
sudo docker-compose down

# Create AMI from instance (backup)
aws ec2 create-image \
  --instance-id <INSTANCE_ID> \
  --name "n8n-backup-$(date +%Y%m%d)" \
  --profile happyhub-cli \
  --region eu-west-1

# Change instance type
aws ec2 modify-instance-attribute \
  --instance-id <INSTANCE_ID> \
  --instance-type t3.medium \
  --profile happyhub-cli \
  --region eu-west-1

# Start services
sudo docker-compose up -d
```

## Support

For issues:
1. Check logs: `sudo docker-compose logs`
2. Check status: `sudo n8n-status.sh`
3. Review this README
4. Check n8n documentation: https://docs.n8n.io
