# Guía de Configuración AWS para HappyHub

**Créditos disponibles:** $1,000 USD
**Account ID:** 128959995116
**Usuario:** edugarciac
**Región principal:** us-east-1 (N. Virginia)

---

## 🔐 PASO 1: Configurar IAM User para CLI/Programmatic Access

### A. Crear IAM User (Desde AWS Console)

1. **Ir a IAM Console:**
   ```
   https://console.aws.amazon.com/iam/
   ```

2. **Crear nuevo usuario:**
   - Users → Add users
   - **Username:** `happyhub-cli`
   - **Access type:** ✅ Programmatic access (Access key)
   - **Console access:** ❌ No necesario

3. **Asignar permisos:**
   - Opción 1 (Desarrollo): **AdministratorAccess** (temporal)
   - Opción 2 (Producción): Crear custom policy con mínimos permisos:
     - `AmazonRDSFullAccess` (Aurora)
     - `AmazonBedrockFullAccess` (AI)
     - `AmazonS3FullAccess` (Storage)
     - `CloudFrontFullAccess` (CDN)
     - `AWSLambda_FullAccess` (Serverless)

4. **Copiar credenciales:**
   - **Access Key ID:** `AKIA...` (guardar)
   - **Secret Access Key:** `...` (guardar - solo se muestra una vez)

5. **Actualizar `aws-credentials.json`:**
   ```json
   "cli": {
     "aws_access_key_id": "AKIA...",
     "aws_secret_access_key": "...",
     "region": "us-east-1",
     "output": "json"
   }
   ```

### B. Configurar AWS CLI Local

```bash
# Instalar AWS CLI (si no está instalado)
brew install awscli  # macOS
# o
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar con las credenciales
aws configure --profile happyhub

# Cuando pregunte, ingresar:
AWS Access Key ID: [TU_ACCESS_KEY_ID]
AWS Secret Access Key: [TU_SECRET_ACCESS_KEY]
Default region name: us-east-1
Default output format: json

# Verificar configuración
aws sts get-caller-identity --profile happyhub

# Deberías ver:
# {
#   "UserId": "...",
#   "Account": "128959995116",
#   "Arn": "arn:aws:iam::128959995116:user/happyhub-cli"
# }
```

---

## 💰 PASO 2: Configurar Billing Alerts (CRÍTICO)

**HACER ESTO ANTES DE USAR CUALQUIER SERVICIO**

### A. Habilitar Billing Alerts

```bash
# Habilitar billing alerts
aws ce put-cost-and-usage-report --profile happyhub

# O desde console:
# https://console.aws.amazon.com/billing/home#/preferences
```

1. Ir a: Billing → Preferences
2. ✅ Activar "Receive Billing Alerts"
3. ✅ Activar "Receive Free Tier Usage Alerts"
4. Guardar

### B. Crear Budgets

```bash
# Crear budget de $45/mes
aws budgets create-budget \
  --account-id 128959995116 \
  --budget file://budget-config.json \
  --notifications-with-subscribers file://budget-notifications.json \
  --profile happyhub
```

**Crear archivo `budget-config.json`:**
```json
{
  "BudgetName": "HappyHub-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "45",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

**Crear archivo `budget-notifications.json`:**
```json
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
        "Address": "e.garcia.casas@gmail.com"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 100,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "e.garcia.casas@gmail.com"
      }
    ]
  }
]
```

### C. Crear CloudWatch Alarms

```bash
# Alarma cuando gastos > $800
aws cloudwatch put-metric-alarm \
  --alarm-name "HappyHub-Credits-80-Percent" \
  --alarm-description "Alert when 80% of AWS credits used" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 800 \
  --comparison-operator GreaterThanThreshold \
  --profile happyhub
```

---

## 🗄️ PASO 3: Configurar Aurora PostgreSQL

### Arquitectura Recomendada

```
Aurora PostgreSQL Serverless v2
- Capacity: 0.5 - 2 ACU (Auto-scaling)
- Storage: Auto-scaling (pago por uso)
- Backup: 7 días retention
- Costo estimado: ~$15-25/mes
```

### A. Crear Aurora Cluster

```bash
# Crear subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name happyhub-subnet-group \
  --db-subnet-group-description "HappyHub Aurora subnet group" \
  --subnet-ids subnet-xxx subnet-yyy \
  --profile happyhub

# Crear security group
aws ec2 create-security-group \
  --group-name happyhub-aurora-sg \
  --description "Security group for HappyHub Aurora" \
  --vpc-id vpc-xxx \
  --profile happyhub

# Permitir acceso desde tu IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 5432 \
  --cidr TU_IP/32 \
  --profile happyhub

# Crear Aurora Serverless v2 cluster
aws rds create-db-cluster \
  --db-cluster-identifier happyhub-db-cluster \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username happyhubadmin \
  --master-user-password $(openssl rand -base64 32) \
  --database-name happyhub \
  --db-subnet-group-name happyhub-subnet-group \
  --vpc-security-group-ids sg-xxx \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=2 \
  --profile happyhub

# Crear instancia Aurora
aws rds create-db-instance \
  --db-instance-identifier happyhub-db-instance-1 \
  --db-cluster-identifier happyhub-db-cluster \
  --db-instance-class db.serverless \
  --engine aurora-postgresql \
  --profile happyhub
```

### B. Obtener Connection String

```bash
# Obtener endpoint
aws rds describe-db-clusters \
  --db-cluster-identifier happyhub-db-cluster \
  --query 'DBClusters[0].Endpoint' \
  --profile happyhub

# Output: happyhub-db-cluster.cluster-xxx.us-east-1.rds.amazonaws.com
```

**Agregar a `.env`:**
```env
# Aurora PostgreSQL
DATABASE_URL=postgresql://happyhubadmin:PASSWORD@happyhub-db-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:5432/happyhub?sslmode=require
AWS_REGION=us-east-1
```

---

## 🤖 PASO 4: Configurar Amazon Bedrock (AI)

### A. Habilitar Bedrock en la Región

1. Ir a: https://console.aws.amazon.com/bedrock/
2. Seleccionar región: **us-east-1**
3. **Model access** → Request access
4. Solicitar acceso a:
   - ✅ **Claude 3.5 Sonnet** (Anthropic)
   - ✅ **Claude 3 Haiku** (Anthropic)
   - ✅ **Titan Embeddings** (Amazon)

### B. Probar Bedrock desde CLI

```bash
# Listar modelos disponibles
aws bedrock list-foundation-models \
  --region us-east-1 \
  --profile happyhub

# Invocar Claude 3.5 Sonnet
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --region us-east-1 \
  --body '{"anthropic_version":"bedrock-2023-05-31","messages":[{"role":"user","content":"Hello from HappyHub!"}],"max_tokens":100}' \
  --cli-binary-format raw-in-base64-out \
  response.json \
  --profile happyhub

# Ver respuesta
cat response.json | jq
```

### C. Usar Bedrock en n8n

**Configurar credenciales en n8n:**
1. Settings → Credentials → Add Credential
2. Tipo: **AWS**
3. Datos:
   - Access Key ID: [TU_ACCESS_KEY]
   - Secret Access Key: [TU_SECRET_KEY]
   - Region: us-east-1
4. Guardar como: "AWS HappyHub"

**Agregar nodo AWS Bedrock en workflow:**
```json
{
  "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
  "name": "Claude 3.5 via Bedrock",
  "parameters": {
    "model": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "maxTokens": 1000
  },
  "credentials": {
    "aws": "AWS HappyHub"
  }
}
```

---

## 📦 PASO 5: Configurar S3 + CloudFront

### A. Crear S3 Bucket para Assets

```bash
# Crear bucket
aws s3 mb s3://happyhub-assets-prod --profile happyhub

# Configurar CORS
aws s3api put-bucket-cors \
  --bucket happyhub-assets-prod \
  --cors-configuration file://s3-cors.json \
  --profile happyhub
```

**Archivo `s3-cors.json`:**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://happyhub.es", "http://localhost:3000"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### B. Crear CloudFront Distribution

```bash
# Crear OAI (Origin Access Identity)
aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
  CallerReference=happyhub-$(date +%s),Comment="HappyHub OAI" \
  --profile happyhub

# Crear distribución
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json \
  --profile happyhub
```

---

## 🔧 PASO 6: Configurar n8n con AWS

### A. Credenciales AWS en n8n

1. **Abrir n8n:** https://n8n-n8n.ljmvxa.easypanel.host
2. **Settings → Credentials → Add Credential**
3. **Seleccionar:** AWS
4. **Configurar:**
   ```
   Access Key ID: [TU_ACCESS_KEY_ID]
   Secret Access Key: [TU_SECRET_ACCESS_KEY]
   Region: us-east-1
   ```
5. **Guardar como:** "AWS HappyHub"

### B. Workflows con AWS

#### Ejemplo: Guardar Reserva en Aurora via Lambda

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.aws",
      "name": "Invoke Lambda - Save Reservation",
      "parameters": {
        "service": "lambda",
        "operation": "invoke",
        "functionName": "happyhub-save-reservation",
        "payload": {
          "reservationData": "={{$json}}"
        }
      },
      "credentials": {
        "aws": "AWS HappyHub"
      }
    }
  ]
}
```

#### Ejemplo: Generar Mensaje con Bedrock

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.httpRequest",
      "name": "Bedrock - Claude AI",
      "parameters": {
        "method": "POST",
        "url": "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-5-sonnet-20241022-v2:0/invoke",
        "authentication": "genericCredentialType",
        "genericAuthType": "awsAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "anthropic_version",
              "value": "bedrock-2023-05-31"
            },
            {
              "name": "messages",
              "value": "[{\"role\":\"user\",\"content\":\"Genera mensaje de confirmación para reserva...\"}]"
            },
            {
              "name": "max_tokens",
              "value": "500"
            }
          ]
        }
      },
      "credentials": {
        "aws": "AWS HappyHub"
      }
    }
  ]
}
```

---

## 📊 PASO 7: Monitoreo de Costos

### Comandos útiles

```bash
# Ver costos actuales del mes
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --profile happyhub

# Ver uso de créditos
aws budgets describe-budgets \
  --account-id 128959995116 \
  --profile happyhub

# Servicios con más gasto
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --profile happyhub | jq '.ResultsByTime[0].Groups | sort_by(.Metrics.BlendedCost.Amount | tonumber) | reverse | .[0:5]'
```

### Dashboard Recomendado

1. **Cost Explorer:** https://console.aws.amazon.com/cost-management/home
2. **Activar:** Filtros por servicio, región, tag
3. **Crear gráficos personalizados:**
   - Gasto diario
   - Gasto por servicio
   - Forecast vs. Budget

---

## 🏗️ Arquitectura Final HappyHub en AWS

```
┌─────────────────────────────────────────────────────┐
│           CloudFront CDN (Global)                   │
│           - Assets estáticos                        │
│           - Cache: 24h                              │
│           Costo: ~$5/mes                            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│               S3 Bucket                             │
│               - Imágenes                            │
│               - Videos                              │
│               - PDFs                                │
│               Costo: ~$2/mes                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│           Vercel (Next.js Frontend)                 │
│           - FREE tier                               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│     API Gateway + Lambda (Opcional)                 │
│     - Serverless APIs                               │
│     - Costo: Pay-per-request (~$5/mes)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│        Aurora PostgreSQL Serverless v2              │
│        - 0.5-2 ACU auto-scaling                     │
│        - Backups: 7 días                            │
│        Costo: ~$20/mes                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│             Amazon Bedrock                          │
│             - Claude 3.5 Sonnet                     │
│             - Pay-per-token                         │
│             Costo: ~$10/mes                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               n8n (Easypanel)                       │
│               - Workflows                           │
│               - Integración AWS                     │
│               Costo: Ya incluido                    │
└─────────────────────────────────────────────────────┘

COSTO TOTAL ESTIMADO: ~$42/mes
DURACIÓN CON $1,000: ~24 meses
```

---

## ✅ Checklist de Configuración

- [ ] IAM User creado
- [ ] AWS CLI configurado localmente
- [ ] Credenciales actualizadas en `aws-credentials.json`
- [ ] Billing alerts configurados
- [ ] Budget de $45/mes creado
- [ ] CloudWatch alarms activadas
- [ ] Aurora PostgreSQL creado
- [ ] Bedrock access solicitado y aprobado
- [ ] S3 bucket creado
- [ ] CloudFront distribution configurada
- [ ] n8n conectado a AWS
- [ ] Variables de entorno actualizadas en Next.js
- [ ] Testing de integración completado

---

## 🆘 Troubleshooting

### Error: "AccessDenied"
**Solución:** Verificar permisos del IAM user

### Error: "ResourceNotFoundException" en Bedrock
**Solución:** Solicitar acceso al modelo en la consola de Bedrock

### Aurora muy costoso
**Solución:** Ajustar ACU min/max: `aws rds modify-current-db-cluster-capacity --db-cluster-identifier happyhub-db-cluster --capacity 0.5`

### Créditos gastándose rápido
**Solución:**
1. Revisar Cost Explorer
2. Detener instancias innecesarias
3. Ajustar auto-scaling
4. Usar Lambda en lugar de EC2

---

**Última actualización:** 25 de diciembre de 2024
**Versión:** 1.0
