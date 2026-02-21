#!/bin/bash

# Script para aplicar schema SQL a través de EC2 como bastion
# Usage: ./apply-schema-via-ec2.sh

set -e

echo "════════════════════════════════════════════════════════════"
echo "  Aplicando Schema SQL a través de EC2 n8n (bastion host)  "
echo "════════════════════════════════════════════════════════════"
echo ""

# Leer password y endpoint
DB_PASSWORD=$(cat migration/.db-password)
DB_ENDPOINT=$(cat migration/aurora-endpoint.txt)
EC2_IP="34.243.177.162"

echo "📋 Configuración:"
echo "  EC2 Bastion: $EC2_IP"
echo "  DB Endpoint: $DB_ENDPOINT"
echo ""

# Verificar si tenemos SSH key
if [ ! -f ~/.ssh/happyhub-key.pem ]; then
    echo "⚠️  No se encontró SSH key en ~/.ssh/happyhub-key.pem"
    echo ""
    echo "Por favor, descarga la key desde AWS Console:"
    echo "1. Ve a EC2 → Key Pairs"
    echo "2. Descarga 'happyhub-key.pem'"
    echo "3. Mueve a ~/.ssh/happyhub-key.pem"
    echo "4. chmod 400 ~/.ssh/happyhub-key.pem"
    echo ""
    exit 1
fi

echo "1️⃣  Instalando PostgreSQL client en EC2..."
ssh -i ~/.ssh/happyhub-key.pem ubuntu@$EC2_IP <<'ENDSSH'
# Instalar psql si no está
if ! command -v psql &> /dev/null; then
    echo "Instalando PostgreSQL client..."
    sudo apt-get update -qq
    sudo apt-get install -y postgresql-client
fi
echo "✅ PostgreSQL client listo"
ENDSSH

echo ""
echo "2️⃣  Copiando archivos SQL a EC2..."
scp -i ~/.ssh/happyhub-key.pem migration/schema.sql ubuntu@$EC2_IP:/tmp/
scp -i ~/.ssh/happyhub-key.pem migration/seed-data.sql ubuntu@$EC2_IP:/tmp/
echo "✅ Archivos copiados"

echo ""
echo "3️⃣  Aplicando schema SQL..."
ssh -i ~/.ssh/happyhub-key.pem ubuntu@$EC2_IP <<ENDSSH
export PGPASSWORD="$DB_PASSWORD"
psql -h $DB_ENDPOINT -U dbadmin -d happyhub -f /tmp/schema.sql
echo "✅ Schema aplicado"
ENDSSH

echo ""
echo "4️⃣  Aplicando seed data..."
ssh -i ~/.ssh/happyhub-key.pem ubuntu@$EC2_IP <<ENDSSH
export PGPASSWORD="$DB_PASSWORD"
psql -h $DB_ENDPOINT -U dbadmin -d happyhub -f /tmp/seed-data.sql
echo "✅ Seed data aplicado"
ENDSSH

echo ""
echo "5️⃣  Verificando tablas creadas..."
ssh -i ~/.ssh/happyhub-key.pem ubuntu@$EC2_IP <<ENDSSH
export PGPASSWORD="$DB_PASSWORD"
psql -h $DB_ENDPOINT -U dbadmin -d happyhub -c "\\dt"
ENDSSH

echo ""
echo "════════════════════════════════════════════════════════════"
echo "           ✅ Schema y datos aplicados correctamente          "
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Puedes conectarte desde EC2 con:"
echo "  ssh -i ~/.ssh/happyhub-key.pem ubuntu@$EC2_IP"
echo "  psql -h $DB_ENDPOINT -U dbadmin -d happyhub"
echo ""
