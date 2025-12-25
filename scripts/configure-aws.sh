#!/bin/bash

# Script para configurar AWS CLI para HappyHub
# IMPORTANTE: Este script NO debe ser committeado con credenciales reales

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         Configuración AWS CLI para HappyHub                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    echo "Instalar con: brew install awscli"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI instalado:${NC} $(aws --version)"
echo ""

# Crear directorio ~/.aws si no existe
mkdir -p ~/.aws

echo -e "${YELLOW}Configurando profile 'happyhub'...${NC}"
echo ""

# Leer credenciales del archivo local
if [ ! -f "aws-credentials.json" ]; then
    echo -e "${RED}❌ Archivo aws-credentials.json no encontrado${NC}"
    echo "Debes crear el archivo aws-credentials.json primero"
    exit 1
fi

# Preguntar por Access Key ID
echo -e "${YELLOW}Ingresa tu AWS Access Key ID:${NC}"
read -p "Access Key ID: " ACCESS_KEY_ID

# Preguntar por Secret Access Key
echo -e "${YELLOW}Ingresa tu AWS Secret Access Key:${NC}"
read -sp "Secret Access Key: " SECRET_ACCESS_KEY
echo ""

# Configurar profile
aws configure set aws_access_key_id "$ACCESS_KEY_ID" --profile happyhub
aws configure set aws_secret_access_key "$SECRET_ACCESS_KEY" --profile happyhub
aws configure set region "us-east-1" --profile happyhub
aws configure set output "json" --profile happyhub

echo ""
echo -e "${GREEN}✓ Credenciales configuradas en ~/.aws/credentials${NC}"
echo ""

# Verificar credenciales
echo -e "${YELLOW}Verificando credenciales...${NC}"
if aws sts get-caller-identity --profile happyhub > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Credenciales válidas${NC}"
    echo ""
    aws sts get-caller-identity --profile happyhub
    echo ""
else
    echo -e "${RED}❌ Error: Credenciales inválidas${NC}"
    exit 1
fi

# Actualizar aws-credentials.json con las nuevas credenciales
echo -e "${YELLOW}Actualizando aws-credentials.json...${NC}"
cat > aws-credentials.json << EOF
{
  "account": {
    "accountId": "128959995116",
    "username": "edugarciac",
    "password": "Eidoubleues@1",
    "email": "e.garcia.casas@gmail.com",
    "region": "us-east-1",
    "console_url": "https://128959995116.signin.aws.amazon.com/console"
  },
  "cli": {
    "aws_access_key_id": "$ACCESS_KEY_ID",
    "aws_secret_access_key": "[HIDDEN - Ver ~/.aws/credentials]",
    "region": "us-east-1",
    "output": "json",
    "profile": "happyhub"
  },
  "credits": {
    "total": 1000,
    "currency": "USD",
    "expiration": "12_meses_desde_activacion",
    "redeemed_date": "2024-12-25"
  },
  "notes": {
    "important": [
      "NUNCA subir este archivo a GitHub",
      "Credenciales almacenadas en ~/.aws/credentials",
      "Usar profile: aws [comando] --profile happyhub",
      "Configurar billing alerts ANTES de usar servicios",
      "Revisar Cost Explorer semanalmente"
    ],
    "services_to_use": [
      "Aurora PostgreSQL (database)",
      "Bedrock (AI/ML platform)",
      "S3 (storage for media)",
      "CloudFront (CDN)",
      "Lambda (serverless functions)",
      "API Gateway (REST APIs)"
    ]
  }
}
EOF

echo -e "${GREEN}✓ aws-credentials.json actualizado${NC}"
echo ""

# Mostrar siguiente paso
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✓ Configuración Completa                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Próximos pasos:${NC}"
echo "1. Configurar billing alerts: Ver AWS_SETUP_GUIDE.md - PASO 2"
echo "2. Crear Aurora database: Ver AWS_SETUP_GUIDE.md - PASO 3"
echo "3. Habilitar Bedrock: Ver AWS_SETUP_GUIDE.md - PASO 4"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  aws sts get-caller-identity --profile happyhub"
echo "  aws s3 ls --profile happyhub"
echo "  aws budgets describe-budgets --account-id 128959995116 --profile happyhub"
echo ""
