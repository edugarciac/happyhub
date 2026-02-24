#!/bin/bash
set -e

# Launch Production n8n EC2 Instance
# This script creates a new EC2 instance with proper configuration

REGION="eu-west-1"
INSTANCE_TYPE="t3.small"  # Upgraded from t3.micro for better performance
AMI_ID="ami-0d940f23d527c3ab1"  # Ubuntu 22.04 LTS in eu-west-1
KEY_NAME="n8n-happyhub-key"
SECURITY_GROUP_NAME="n8n-production-sg"
VOLUME_SIZE=30  # GB
INSTANCE_NAME="n8n-production-happyhub"

echo "======================================"
echo "Launching n8n Production Instance"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 1. Create or verify key pair
log_info "Checking key pair..."
if ! aws ec2 describe-key-pairs --key-names ${KEY_NAME} --profile happyhub-cli --region ${REGION} &>/dev/null; then
    log_info "Creating new key pair..."
    aws ec2 create-key-pair \
        --key-name ${KEY_NAME} \
        --profile happyhub-cli \
        --region ${REGION} \
        --query 'KeyMaterial' \
        --output text > ~/.ssh/${KEY_NAME}.pem
    chmod 400 ~/.ssh/${KEY_NAME}.pem
    log_info "Key pair saved to ~/.ssh/${KEY_NAME}.pem"
else
    log_info "Key pair already exists"
fi

# 2. Create security group
log_info "Creating security group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name ${SECURITY_GROUP_NAME} \
    --description "Security group for n8n production" \
    --profile happyhub-cli \
    --region ${REGION} \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${SECURITY_GROUP_NAME}" \
        --profile happyhub-cli \
        --region ${REGION} \
        --query 'SecurityGroups[0].GroupId' \
        --output text)

log_info "Security Group ID: ${SG_ID}"

# 3. Configure security group rules
log_info "Configuring security group rules..."

# SSH (22)
aws ec2 authorize-security-group-ingress \
    --group-id ${SG_ID} \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --profile happyhub-cli \
    --region ${REGION} 2>/dev/null || true

# HTTP (80)
aws ec2 authorize-security-group-ingress \
    --group-id ${SG_ID} \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --profile happyhub-cli \
    --region ${REGION} 2>/dev/null || true

# HTTPS (443)
aws ec2 authorize-security-group-ingress \
    --group-id ${SG_ID} \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --profile happyhub-cli \
    --region ${REGION} 2>/dev/null || true

# n8n (5678)
aws ec2 authorize-security-group-ingress \
    --group-id ${SG_ID} \
    --protocol tcp \
    --port 5678 \
    --cidr 0.0.0.0/0 \
    --profile happyhub-cli \
    --region ${REGION} 2>/dev/null || true

log_info "Security group configured"

# 4. Create user data script
cat > /tmp/user-data.sh <<'USERDATA'
#!/bin/bash
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user-data script..."

# Update system
apt-get update -qq
apt-get upgrade -y -qq

# Install essentials
apt-get install -y -qq curl wget unzip git

# Download setup script
mkdir -p /root/n8n-setup
cd /root/n8n-setup

# Setup script will be uploaded separately
echo "User-data completed. Ready for n8n installation."
USERDATA

# 5. Launch EC2 instance
log_info "Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ${AMI_ID} \
    --instance-type ${INSTANCE_TYPE} \
    --key-name ${KEY_NAME} \
    --security-group-ids ${SG_ID} \
    --user-data file:///tmp/user-data.sh \
    --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":${VOLUME_SIZE},\"VolumeType\":\"gp3\",\"Iops\":3000,\"DeleteOnTermination\":true}}]" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}},{Key=Project,Value=HappyHub},{Key=Environment,Value=Production}]" \
    --profile happyhub-cli \
    --region ${REGION} \
    --query 'Instances[0].InstanceId' \
    --output text)

log_info "Instance launched: ${INSTANCE_ID}"

# 6. Wait for instance to be running
log_info "Waiting for instance to start..."
aws ec2 wait instance-running \
    --instance-ids ${INSTANCE_ID} \
    --profile happyhub-cli \
    --region ${REGION}

# 7. Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids ${INSTANCE_ID} \
    --profile happyhub-cli \
    --region ${REGION} \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

log_info "Instance running at: ${PUBLIC_IP}"

# 8. Wait for SSH to be ready
log_info "Waiting for SSH to be ready (this may take 2-3 minutes)..."
sleep 60
for i in {1..10}; do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i ~/.ssh/${KEY_NAME}.pem ubuntu@${PUBLIC_IP} "echo 'SSH ready'" &>/dev/null; then
        log_info "SSH is ready!"
        break
    fi
    echo "Attempt $i/10..."
    sleep 15
done

echo ""
echo "======================================"
echo "EC2 Instance Ready!"
echo "======================================"
echo ""
echo "Instance ID: ${INSTANCE_ID}"
echo "Public IP: ${PUBLIC_IP}"
echo "Instance Type: ${INSTANCE_TYPE}"
echo "Disk Size: ${VOLUME_SIZE}GB"
echo "SSH Key: ~/.ssh/${KEY_NAME}.pem"
echo ""
echo "Next steps:"
echo "1. SSH into the instance:"
echo "   ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@${PUBLIC_IP}"
echo ""
echo "2. Upload and run the setup script:"
echo "   scp -i ~/.ssh/${KEY_NAME}.pem infrastructure/n8n-production-setup.sh ubuntu@${PUBLIC_IP}:~/"
echo "   ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@${PUBLIC_IP}"
echo "   sudo bash n8n-production-setup.sh"
echo ""
echo "3. Access n8n at:"
echo "   http://${PUBLIC_IP}:5678"
echo ""

# Save connection info
cat > infrastructure/n8n-connection.txt <<CONN
Instance ID: ${INSTANCE_ID}
Public IP: ${PUBLIC_IP}
Region: ${REGION}
SSH Command: ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@${PUBLIC_IP}
n8n URL: http://${PUBLIC_IP}:5678
CONN

log_info "Connection details saved to infrastructure/n8n-connection.txt"
echo ""
