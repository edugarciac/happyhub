# Quick Start Guide - n8n Production Setup

## One-Command Setup

```bash
cd infrastructure
chmod +x full-setup.sh
./full-setup.sh
```

This will:
1. ✅ Terminate old instance
2. ✅ Create S3 backup bucket
3. ✅ Launch new EC2 (t3.small, 30GB)
4. ✅ Install Docker + n8n + PostgreSQL
5. ✅ Configure backups and monitoring

**Time:** ~10 minutes total

## Manual Setup (Step-by-Step)

### 1. Terminate Old Instance

```bash
aws ec2 terminate-instances \
  --instance-ids i-00e6ad6229322f4f3 \
  --profile happyhub-cli \
  --region eu-west-1
```

### 2. Create S3 Bucket

```bash
aws s3 mb s3://happyhub-n8n-backups \
  --profile happyhub-cli \
  --region eu-west-1
```

### 3. Launch EC2

```bash
cd infrastructure
./launch-n8n-ec2.sh
```

### 4. Install n8n

```bash
# Get IP from previous step
PUBLIC_IP="<your-public-ip>"

# Upload script
scp -i ~/.ssh/n8n-happyhub-key.pem \
    n8n-production-setup.sh \
    ubuntu@${PUBLIC_IP}:~/

# SSH and run
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@${PUBLIC_IP}
sudo bash n8n-production-setup.sh
```

## First Login

1. Open: `http://<PUBLIC_IP>:5678`
2. Login: `admin` / `ChangeThisPassword123!`
3. **Change password immediately!**

## Import Workflows

Upload these files via n8n UI:
- `n8n/n8n-nodes/n8n-reserva-neon-whatsapp.json`

## Update HappyHub Code

Update `.env` or Amplify environment variables:
```
N8N_WEBHOOK_URL=http://<PUBLIC_IP>:5678/webhook/reservation-request
```

## Useful Commands

```bash
# Check status
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@<IP>
sudo n8n-status.sh

# View logs
cd /opt/n8n && sudo docker-compose logs -f n8n

# Restart
cd /opt/n8n && sudo docker-compose restart

# Manual backup
sudo /opt/backups/backup-n8n.sh
```

## Automated Tasks

✅ **Weekly backup** on Sundays at 2 AM → S3
✅ **Weekly cleanup** on Sundays at 3 AM
✅ **Auto-restart** on failure

## Cost

- **EC2 t3.small:** ~€15/month
- **30GB gp3 disk:** ~€3/month
- **S3 backups:** ~€0.25/month
- **Total:** ~€19/month

## Troubleshooting

**n8n not responding?**
```bash
cd /opt/n8n
sudo docker-compose restart n8n
```

**Out of disk space?**
```bash
sudo /opt/backups/cleanup-logs.sh
sudo docker system prune -af
```

**Need to restore?**
```bash
# List backups
aws s3 ls s3://happyhub-n8n-backups/backups/

# See full README.md for restore steps
```

## What's Different from Old Setup?

| Feature | Old Setup | New Setup |
|---------|-----------|-----------|
| Instance | t3.micro (1GB RAM) | t3.small (2GB RAM) |
| Disk | 20GB | 30GB gp3 |
| Database | None (file-based) | PostgreSQL |
| Backups | Manual | Automated daily |
| Monitoring | None | Status dashboard |
| Data persistence | ❌ Lost on restart | ✅ Persistent |
| Auto-recovery | ❌ No | ✅ Docker restart |

## Security Checklist

- [ ] Change default password
- [ ] Verify security group rules
- [ ] Test backup/restore
- [ ] Update webhook URLs
- [ ] Document new IP address
- [ ] Set calendar reminder for monthly updates

---

**Need help?** See `README.md` for detailed documentation.
