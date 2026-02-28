#!/bin/bash
# Add environment variables to n8n via docker-compose

echo "🔐 Añadiendo variables de entorno a n8n..."
echo ""

# Variables a añadir
cat << 'EOF'
Variables que se añadirán:
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_ACCESS_TOKEN
- ADMIN_WHATSAPP_NUMBER

IMPORTANTE: Necesitas el WHATSAPP_PHONE_NUMBER_ID de Meta:
https://developers.facebook.com/apps → Tu App → WhatsApp → API Setup
EOF

read -p "¿Tienes el Phone Number ID? (s/n): " has_phone_id

if [ "$has_phone_id" != "s" ]; then
    echo "❌ Consigue el Phone Number ID primero y vuelve a ejecutar este script"
    exit 1
fi

read -p "Introduce WHATSAPP_PHONE_NUMBER_ID: " phone_id

echo ""
echo "📝 Conectando a n8n via SSH..."

ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@52.208.80.224 << ENDSSH
cd /opt/n8n

echo "📄 Backup del docker-compose.yml actual..."
sudo cp docker-compose.yml docker-compose.yml.backup

echo "✏️  Añadiendo variables de entorno..."

# Check if environment section exists
if ! grep -q "WHATSAPP_ACCESS_TOKEN" docker-compose.yml 2>/dev/null; then
    sudo sed -i '/n8n:/a\    environment:' docker-compose.yml
    sudo sed -i '/environment:/a\      - WHATSAPP_PHONE_NUMBER_ID=$phone_id' docker-compose.yml
    sudo sed -i '/WHATSAPP_PHONE_NUMBER_ID/a\      - WHATSAPP_ACCESS_TOKEN=EAAXSgOo4ZA0oBQ5fZCCHCFXFpFZA3reZC8btEFw7G4fsauu2yhkZBSy2WhMHJTI0dc6Ps6HsjLZBTLXZADyZByoBI4DQ0aVtNi2h7P99V5owzqZBYCleWb9rlZCZBQnb1KlqXcZAwoXPxg9HVggWIFvlBXkIOSeWwvTMhQwPOLBDnxA40MFdgSKbZBdOsFOEA2cNLd6bsvCPnzbzOuNJucb5C3Gplk6a6oVhvD9Or70ZCEZAk8ADVRD6FTcZC3ws9g01Wq1ekARe6R0EY8PolQd11KSSFkwz' docker-compose.yml
    sudo sed -i '/WHATSAPP_ACCESS_TOKEN/a\      - ADMIN_WHATSAPP_NUMBER=34624645517' docker-compose.yml
fi

echo "✅ Variables añadidas"

echo "🔄 Reiniciando n8n..."
sudo docker-compose restart n8n

echo "⏳ Esperando a que n8n reinicie..."
sleep 10

echo "✅ n8n reiniciado con variables de entorno"
echo ""
echo "🌐 Accede a: https://n8n.happyhub.es"
echo "Las variables ahora están disponibles como:"
echo "  {{ \$env.WHATSAPP_PHONE_NUMBER_ID }}"
echo "  {{ \$env.WHATSAPP_ACCESS_TOKEN }}"
echo "  {{ \$env.ADMIN_WHATSAPP_NUMBER }}"

ENDSSH

echo ""
echo "✅ Configuración completada!"
