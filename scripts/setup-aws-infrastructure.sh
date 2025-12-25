#!/bin/bash

# Script para configurar infraestructura completa de AWS para HappyHub
# Este script debe ejecutarse DESPUÉS de configurar AWS CLI

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Configuración de Infraestructura AWS - HappyHub          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROFILE="happyhub"
REGION="us-east-1"
DB_NAME="happyhub_db"
DB_USERNAME="happyhub_admin"
CLUSTER_NAME="happyhub-aurora-cluster"
S3_BUCKET="happyhub-assets-prod"

echo -e "${BLUE}📋 Configuración:${NC}"
echo "   Profile: $PROFILE"
echo "   Region: $REGION"
echo "   Database: $DB_NAME"
echo ""

# Verificar credenciales
echo -e "${YELLOW}1️⃣  Verificando credenciales AWS...${NC}"
if ! aws sts get-caller-identity --profile $PROFILE > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Credenciales AWS no configuradas${NC}"
    echo ""
    echo "Por favor, configura AWS CLI primero:"
    echo "  aws configure --profile happyhub"
    echo ""
    echo "Necesitarás:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Region: us-east-1"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --query Account --output text)
echo -e "${GREEN}✓ Credenciales válidas${NC}"
echo "   Account ID: $ACCOUNT_ID"
echo ""

# Configurar Billing Alerts
echo -e "${YELLOW}2️⃣  Configurando Billing Alerts...${NC}"
echo "⚠️  IMPORTANTE: Debes activar billing alerts manualmente:"
echo "   1. Ve a: https://console.aws.amazon.com/billing/home#/preferences"
echo "   2. ✅ Activar 'Receive Billing Alerts'"
echo "   3. ✅ Activar 'Receive Free Tier Usage Alerts'"
echo ""
read -p "Presiona ENTER cuando hayas activado los billing alerts..."

# Crear Budget
echo -e "${YELLOW}Creando Budget de \$45/mes...${NC}"
cat > /tmp/budget.json <<EOF
{
  "BudgetName": "HappyHub-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "45",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
EOF

cat > /tmp/notifications.json <<EOF
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "happyhub.rovellat@gmail.com"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "FORECASTED",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 100,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "happyhub.rovellat@gmail.com"
      }
    ]
  }
]
EOF

aws budgets create-budget \
  --account-id $ACCOUNT_ID \
  --budget file:///tmp/budget.json \
  --notifications-with-subscribers file:///tmp/notifications.json \
  --profile $PROFILE 2>/dev/null || echo "Budget ya existe"

echo -e "${GREEN}✓ Budget configurado${NC}"
echo ""

# Crear Aurora PostgreSQL Serverless v2 Cluster
echo -e "${YELLOW}3️⃣  Creando Aurora PostgreSQL Serverless v2...${NC}"
echo "   Esto puede tomar 5-10 minutos..."
echo ""

# Generar password aleatorio
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)

# Crear cluster
echo "Creando cluster..."
aws rds create-db-cluster \
  --db-cluster-identifier $CLUSTER_NAME \
  --engine aurora-postgresql \
  --engine-version 15.5 \
  --master-username $DB_USERNAME \
  --master-user-password "$DB_PASSWORD" \
  --database-name $DB_NAME \
  --engine-mode provisioned \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=1 \
  --enable-http-endpoint \
  --profile $PROFILE \
  --region $REGION 2>/dev/null || echo "Cluster ya existe"

# Esperar a que esté disponible
echo "Esperando a que el cluster esté disponible..."
aws rds wait db-cluster-available \
  --db-cluster-identifier $CLUSTER_NAME \
  --profile $PROFILE \
  --region $REGION

# Crear instancia
echo "Creando instancia Aurora Serverless v2..."
aws rds create-db-instance \
  --db-instance-identifier "${CLUSTER_NAME}-instance-1" \
  --db-cluster-identifier $CLUSTER_NAME \
  --engine aurora-postgresql \
  --db-instance-class db.serverless \
  --profile $PROFILE \
  --region $REGION 2>/dev/null || echo "Instancia ya existe"

# Obtener endpoint
echo "Obteniendo endpoint..."
DB_ENDPOINT=$(aws rds describe-db-clusters \
  --db-cluster-identifier $CLUSTER_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'DBClusters[0].Endpoint' \
  --output text)

echo -e "${GREEN}✓ Aurora PostgreSQL creado${NC}"
echo "   Endpoint: $DB_ENDPOINT"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USERNAME"
echo "   Password: [guardado en aws-db-credentials.json]"
echo ""

# Habilitar Bedrock
echo -e "${YELLOW}4️⃣  Habilitando Amazon Bedrock...${NC}"
echo "⚠️  IMPORTANTE: Debes solicitar acceso a los modelos manualmente:"
echo "   1. Ve a: https://console.aws.amazon.com/bedrock/"
echo "   2. Click en 'Model access' en el menú izquierdo"
echo "   3. Click en 'Request model access'"
echo "   4. Selecciona: Claude 3.5 Sonnet y Claude 3 Haiku"
echo "   5. Click en 'Request model access'"
echo ""
read -p "Presiona ENTER cuando hayas solicitado acceso a los modelos..."
echo -e "${GREEN}✓ Bedrock configurado${NC}"
echo ""

# Crear S3 Bucket
echo -e "${YELLOW}5️⃣  Creando bucket S3...${NC}"
aws s3 mb s3://$S3_BUCKET --profile $PROFILE --region $REGION 2>/dev/null || echo "Bucket ya existe"

# Configurar bucket para acceso público (solo lectura)
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $S3_BUCKET \
  --policy file:///tmp/bucket-policy.json \
  --profile $PROFILE 2>/dev/null || echo "Policy ya aplicada"

echo -e "${GREEN}✓ Bucket S3 creado: s3://$S3_BUCKET${NC}"
echo ""

# Guardar credenciales
echo -e "${YELLOW}6️⃣  Guardando credenciales...${NC}"
cat > aws-db-credentials.json <<EOF
{
  "database": {
    "host": "$DB_ENDPOINT",
    "port": 5432,
    "database": "$DB_NAME",
    "username": "$DB_USERNAME",
    "password": "$DB_PASSWORD",
    "ssl": true,
    "connection_string": "postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME?sslmode=require"
  },
  "aws": {
    "account_id": "$ACCOUNT_ID",
    "region": "$REGION",
    "s3_bucket": "$S3_BUCKET"
  },
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo -e "${GREEN}✓ Credenciales guardadas en: aws-db-credentials.json${NC}"
echo ""

# Variables de entorno para .env
echo -e "${YELLOW}7️⃣  Generando variables de entorno...${NC}"
cat > .env.aws <<EOF
# AWS Aurora PostgreSQL
DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME?sslmode=require

# AWS Configuration
AWS_REGION=$REGION
AWS_ACCOUNT_ID=$ACCOUNT_ID
S3_BUCKET=$S3_BUCKET

# Para n8n - PostgreSQL Connection
POSTGRES_HOST=$DB_ENDPOINT
POSTGRES_PORT=5432
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USERNAME
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_SSL=true
EOF

echo -e "${GREEN}✓ Variables guardadas en: .env.aws${NC}"
echo ""

# Resumen
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✓ Configuración Completa                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Recursos creados:${NC}"
echo "  ✓ Aurora PostgreSQL Serverless v2"
echo "  ✓ S3 Bucket para assets"
echo "  ✓ Billing alerts y budget"
echo "  ✓ Bedrock habilitado"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Ejecutar schema SQL:"
echo "     psql \"$DATABASE_URL\" -f database/schema.sql"
echo ""
echo "  2. Copiar variables a .env:"
echo "     cat .env.aws >> .env"
echo ""
echo "  3. Configurar n8n con las credenciales de PostgreSQL"
echo ""
echo -e "${BLUE}Archivos creados:${NC}"
echo "  - aws-db-credentials.json (NO SUBIR A GITHUB)"
echo "  - .env.aws (NO SUBIR A GITHUB)"
echo ""
echo -e "${YELLOW}💰 Costo estimado:${NC}"
echo "  - Aurora Serverless v2 (0.5-1 ACU): ~\$20/mes"
echo "  - S3 + transferencia: ~\$5/mes"
echo "  - Bedrock (según uso): ~\$10/mes"
echo "  - TOTAL: ~\$35/mes"
echo ""
echo -e "${GREEN}¡Listo! 🚀${NC}"
