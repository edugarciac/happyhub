#!/bin/bash
#
# Configure n8n with domain and SSL certificate
# Usage: sudo bash setup-n8n-domain.sh n8n.happyhub.es admin@happyhub.es
#

set -e

DOMAIN=${1:-n8n.happyhub.es}
EMAIL=${2:-admin@happyhub.es}

echo "========================================="
echo "n8n Domain & SSL Setup"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: Please run as root (sudo)"
    exit 1
fi

# Install nginx and certbot
echo "Installing nginx and certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

# Stop nginx temporarily
systemctl stop nginx

# Configure nginx for n8n
echo "Configuring nginx for n8n..."
cat > /etc/nginx/sites-available/n8n << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to n8n
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket support
        proxy_read_timeout 86400;
        proxy_buffering off;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/n8n
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Start nginx
systemctl start nginx
systemctl enable nginx

# Wait for DNS propagation
echo ""
echo "Checking DNS propagation for $DOMAIN..."
echo "Expected IP: $(curl -s ifconfig.me)"
echo "DNS resolves to: $(dig +short $DOMAIN | tail -1)"
echo ""
echo "If DNS is not propagated yet, wait a few minutes and re-run this script."
read -p "Press Enter to continue with SSL setup (or Ctrl+C to abort)..."

# Obtain SSL certificate
echo ""
echo "Obtaining SSL certificate from Let's Encrypt..."
certbot --nginx -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect

# Update n8n webhook URL environment
echo ""
echo "Updating n8n webhook URL..."
cd /opt/n8n
if grep -q "WEBHOOK_URL" docker-compose.yml; then
    sed -i "s|WEBHOOK_URL=.*|WEBHOOK_URL=https://$DOMAIN|" docker-compose.yml
else
    # Add to environment section
    sed -i "/environment:/a\      - WEBHOOK_URL=https://$DOMAIN" docker-compose.yml
fi

# Restart n8n to apply changes
docker-compose restart n8n

# Test connection
echo ""
echo "========================================="
echo "✅ Setup complete!"
echo "========================================="
echo ""
echo "n8n URL: https://$DOMAIN"
echo "Webhook: https://$DOMAIN/webhook/reservation-request"
echo ""
echo "Test access:"
echo "  curl https://$DOMAIN"
echo ""
echo "SSL certificate will auto-renew via certbot."
echo "========================================="
