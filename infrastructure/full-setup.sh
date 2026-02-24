#!/bin/bash
set -e

# Complete n8n Production Setup Orchestrator
# This script runs all steps to deploy n8n from scratch

echo "======================================"
echo "n8n Production Deployment - HappyHub"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found. Install it first."
    exit 1
fi

if ! aws sts get-caller-identity --profile happyhub-cli &> /dev/null; then
    log_error "AWS CLI profile 'happyhub-cli' not configured"
    exit 1
fi

log_info "Prerequisites OK"
echo ""

# Step 1: Clean up old instance
echo "======================================"
echo "Step 1: Clean Up Old Instance"
echo "======================================"
echo ""

read -p "Terminate old instance i-00e6ad6229322f4f3? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Terminating old instance..."
    aws ec2 terminate-instances \
        --instance-ids i-00e6ad6229322f4f3 \
        --profile happyhub-cli \
        --region eu-west-1 || log_warn "Instance may not exist"

    log_info "Waiting 30 seconds for termination..."
    sleep 30
fi

# Step 2: Create S3 backup bucket
echo ""
echo "======================================"
echo "Step 2: Create S3 Backup Bucket"
echo "======================================"
echo ""

if aws s3 ls s3://happyhub-n8n-backups --profile happyhub-cli &> /dev/null; then
    log_info "Bucket already exists"
else
    log_info "Creating S3 bucket..."
    aws s3 mb s3://happyhub-n8n-backups \
        --profile happyhub-cli \
        --region eu-west-1

    aws s3api put-bucket-versioning \
        --bucket happyhub-n8n-backups \
        --versioning-configuration Status=Enabled \
        --profile happyhub-cli \
        --region eu-west-1

    log_info "S3 bucket created with versioning"
fi

# Step 3: Launch EC2
echo ""
echo "======================================"
echo "Step 3: Launch EC2 Instance"
echo "======================================"
echo ""

./launch-n8n-ec2.sh

# Step 4: Install n8n
echo ""
echo "======================================"
echo "Step 4: Install n8n"
echo "======================================"
echo ""

if [ -f "n8n-connection.txt" ]; then
    PUBLIC_IP=$(grep "Public IP:" n8n-connection.txt | awk '{print $3}')

    log_info "Uploading setup script to ${PUBLIC_IP}..."
    scp -i ~/.ssh/n8n-happyhub-key.pem \
        -o StrictHostKeyChecking=no \
        n8n-production-setup.sh \
        ubuntu@${PUBLIC_IP}:~/

    log_info "Running installation (this takes 3-5 minutes)..."
    ssh -i ~/.ssh/n8n-happyhub-key.pem \
        -o StrictHostKeyChecking=no \
        ubuntu@${PUBLIC_IP} \
        "sudo bash n8n-production-setup.sh"

    echo ""
    echo "======================================"
    echo "Installation Complete!"
    echo "======================================"
    echo ""
    echo "n8n URL: http://${PUBLIC_IP}:5678"
    echo "Username: admin"
    echo "Password: ChangeThisPassword123!"
    echo ""
    echo "⚠️  Change password immediately after login!"
    echo ""
    echo "Next steps:"
    echo "1. Open http://${PUBLIC_IP}:5678 in browser"
    echo "2. Login and change password"
    echo "3. Import workflows from n8n/n8n-nodes/"
    echo "4. Update N8N_WEBHOOK_URL in your app"
    echo ""
else
    log_error "Connection info not found. Check launch-n8n-ec2.sh output"
    exit 1
fi
