# Configuración AWS Paso a Paso - HappyHub

## 📋 Prerequisitos

- ✅ Cuenta AWS: 128959995116
- ✅ Email: happyhub.rovellat@gmail.com
- ✅ Créditos: $1,000 USD
- ⏳ Necesitas: Access Key ID y Secret Access Key

---

## Paso 1: Crear IAM User para CLI

### 1.1 Acceder a IAM Console

```
https://console.aws.amazon.com/iam/
```

**Credenciales de acceso:**
- Username: edugarciac
- Password: Eidoubleues@1

### 1.2 Crear Access Keys

1. En el menú izquierdo, click en **"Users"**
2. Busca tu usuario: **edugarciac**
3. Click en la pestaña **"Security credentials"**
4. Scroll hasta **"Access keys"**
5. Click en **"Create access key"**
6. Selecciona: **"Command Line Interface (CLI)"**
7. Check: "I understand the above recommendation"
8. Click **"Next"**
9. Description: "HappyHub CLI Access"
10. Click **"Create access key"**

**⚠️ IMPORTANTE:** Copia y guarda estas credenciales inmediatamente, no se pueden recuperar después:

```
Access key ID: AKIA...
Secret access key: ********
```

---

## Paso 2: Configurar AWS CLI

### 2.1 Verificar AWS CLI instalado

```bash
aws --version
```

Si no está instalado:
```bash
# macOS
brew install awscli

# O descarga desde: https://aws.amazon.com/cli/
```

### 2.2 Configurar perfil happyhub

```bash
cd /Users/e.garcia.casas/OneDrive - Allianz/Code/happyhub
aws configure --profile happyhub
```

**Cuando te pida:**
```
AWS Access Key ID: [PEGA TU ACCESS KEY]
AWS Secret Access Key: [PEGA TU SECRET KEY]
Default region name: us-east-1
Default output format: json
```

### 2.3 Verificar configuración

```bash
aws sts get-caller-identity --profile happyhub
```

Deberías ver:
```json
{
    "UserId": "...",
    "Account": "128959995116",
    "Arn": "arn:aws:iam::128959995116:user/edugarciac"
}
```

---

## Paso 3: Ejecutar Script de Infraestructura

### 3.1 Dar permisos al script

```bash
chmod +x scripts/setup-aws-infrastructure.sh
```

### 3.2 Ejecutar script

```bash
./scripts/setup-aws-infrastructure.sh
```

**El script hará:**
1. ✅ Verificar credenciales
2. ✅ Configurar billing alerts (requiere acción manual)
3. ✅ Crear Aurora PostgreSQL Serverless v2
4. ✅ Habilitar Amazon Bedrock (requiere acción manual)
5. ✅ Crear bucket S3
6. ✅ Guardar credenciales en archivos locales

### 3.3 Acciones manuales requeridas

#### A) Activar Billing Alerts

Cuando el script te lo pida:
1. Ve a: https://console.aws.amazon.com/billing/home#/preferences
2. ✅ Check "Receive Billing Alerts"
3. ✅ Check "Receive Free Tier Usage Alerts"
4. Email: happyhub.rovellat@gmail.com
5. Guardar
6. Vuelve al terminal y presiona ENTER

#### B) Habilitar modelos Bedrock

Cuando el script te lo pida:
1. Ve a: https://console.aws.amazon.com/bedrock/
2. Menu izquierdo → **"Model access"**
3. Click **"Request model access"**
4. Selecciona:
   - ☑️ Claude 3.5 Sonnet v2
   - ☑️ Claude 3 Haiku
5. Click **"Request model access"**
6. Espera aprobación (usualmente instantánea)
7. Vuelve al terminal y presiona ENTER

---

## Paso 4: Ejecutar Schema SQL

### 4.1 Instalar psql (si no lo tienes)

```bash
# macOS
brew install postgresql
```

### 4.2 Obtener connection string

El script creó el archivo `aws-db-credentials.json`. Verifica el contenido:

```bash
cat aws-db-credentials.json
```

Copia el valor de `connection_string`.

### 4.3 Ejecutar schema

```bash
psql "[PEGA_CONNECTION_STRING_AQUI]" -f database/schema.sql
```

Ejemplo:
```bash
psql "postgresql://happyhub_admin:ABC123xyz@happyhub-aurora-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:5432/happyhub_db?sslmode=require" -f database/schema.sql
```

Deberías ver:
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
...
```

### 4.4 Verificar tablas creadas

```bash
psql "[CONNECTION_STRING]" -c "\dt"
```

Deberías ver:
```
 public | payments                       | table | happyhub_admin
 public | reservation_status_history     | table | happyhub_admin
 public | reservations                   | table | happyhub_admin
 public | settings                       | table | happyhub_admin
```

---

## Paso 5: Configurar Variables de Entorno

### 5.1 Copiar variables a .env

```bash
cat .env.aws >> .env
```

### 5.2 Verificar .env

```bash
cat .env
```

Debería contener:
```env
DATABASE_URL=postgresql://happyhub_admin:...
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=128959995116
S3_BUCKET=happyhub-assets-prod
POSTGRES_HOST=...
POSTGRES_PORT=5432
...
```

---

## Paso 6: Configurar n8n con PostgreSQL

### 6.1 Acceder a n8n

```
https://n8n-n8n.ljmvxa.easypanel.host
```

### 6.2 Agregar credencial PostgreSQL

1. Menu → **"Credentials"**
2. Click **"Add Credential"**
3. Buscar: **"Postgres"**
4. Completar:

```
Credential name: Aurora PostgreSQL HappyHub
Host: [copiar de aws-db-credentials.json]
Database: happyhub_db
User: happyhub_admin
Password: [copiar de aws-db-credentials.json]
Port: 5432
SSL: Enable
```

5. Click **"Test"** → Debe decir "Connection successful"
6. Click **"Save"**

### 6.3 Importar workflow

1. Menu → **"Workflows"**
2. Click **"Import from file"**
3. Seleccionar: `n8n/workflows/reservations-management-complete.json`
4. Click **"Import"**

### 6.4 Configurar credenciales en workflow

1. Abrir workflow importado
2. Para cada nodo que diga "Credentials not set":
   - Google Calendar → Seleccionar "Google Calendar happyhub.rovellat"
   - PostgreSQL → Seleccionar "Aurora PostgreSQL HappyHub"
   - SMTP → Configurar con gmail

3. Click **"Save"**
4. Click **"Active"** (toggle arriba a la derecha)

---

## Paso 7: Probar el Sistema

### 7.1 Obtener URLs de webhooks

En n8n, para cada webhook node:
1. Click en el nodo "Webhook"
2. Copiar la "Production URL"

Ejemplo:
```
https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request
https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-approval
```

### 7.2 Actualizar .env con URLs

```bash
# Agregar al .env
N8N_WEBHOOK_RESERVATION_REQUEST=https://...
N8N_WEBHOOK_RESERVATION_APPROVAL=https://...
```

### 7.3 Probar con curl

```bash
# Test disponibilidad ocupada (debe retornar 409)
curl -X POST https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Usuario",
    "email": "test@example.com",
    "phone": "666555444",
    "eventType": "cumpleaños",
    "date": "2025-01-15",
    "timeSlot": "afternoon",
    "guests": 50,
    "totalPrice": 170,
    "paymentMethod": "card"
  }'
```

---

## 📊 Monitoreo de Costos

### Ver costos actuales

```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --profile happyhub
```

### Ver presupuesto

```bash
aws budgets describe-budgets \
  --account-id 128959995116 \
  --profile happyhub
```

---

## 🔒 Seguridad

### Archivos a NO subir a GitHub

Verifica que `.gitignore` incluya:
```
aws-db-credentials.json
.env.aws
.env
aws-credentials.json
```

### Rotar credenciales cada 90 días

```bash
# Cada 3 meses, crear nuevas access keys
aws iam create-access-key --user-name edugarciac --profile happyhub
```

---

## 🆘 Troubleshooting

### Error: "Could not connect to database"

```bash
# Verificar que el cluster está disponible
aws rds describe-db-clusters \
  --db-cluster-identifier happyhub-aurora-cluster \
  --profile happyhub \
  --query 'DBClusters[0].Status'
```

### Error: "Access denied"

```bash
# Verificar usuario IAM tiene permisos
aws iam list-attached-user-policies \
  --user-name edugarciac \
  --profile happyhub
```

### Costos muy altos

```bash
# Ver servicios que están costando más
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --profile happyhub
```

---

## ✅ Checklist Final

- [ ] IAM User Access Keys creadas
- [ ] AWS CLI configurado con perfil `happyhub`
- [ ] Script `setup-aws-infrastructure.sh` ejecutado
- [ ] Billing alerts activados
- [ ] Bedrock models aprobados
- [ ] Schema SQL ejecutado en Aurora
- [ ] Variables en .env configuradas
- [ ] n8n PostgreSQL credential creada
- [ ] n8n workflow importado y activado
- [ ] Webhooks URLs guardadas en .env
- [ ] Sistema probado con curl

---

**Estado:** ⏳ Pendiente de ejecución
**Tiempo estimado:** 30-45 minutos
**Costo estimado:** ~$35/mes

¿Listo para empezar? 🚀
