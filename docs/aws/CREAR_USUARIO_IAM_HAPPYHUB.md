# Crear Usuario IAM para HappyHub en AWS

Guía paso a paso para crear un usuario IAM con permisos apropiados.

## 🎯 Objetivo

Crear usuario IAM con permisos para:
- Amplify (deploy, configuración)
- EC2 (n8n server management)
- RDS/Neon (database backups)
- S3 (storage)
- CloudFront (CDN)
- SES (emails)

---

## 📋 Paso a Paso en AWS Console

### Paso 1: Acceder a IAM

1. **Login:** https://console.aws.amazon.com/
2. **Región:** eu-west-1 (Ireland)
3. **Busca:** IAM en el buscador superior
4. **Click:** IAM

### Paso 2: Crear Usuario

1. **IAM Dashboard → Users (menú izquierdo)**
2. **Click:** "Add users" (botón naranja)
3. **User name:** `happyhub-admin`
4. **AWS credential type:** ✓ Access key - Programmatic access
5. **Click:** Next

### Paso 3: Asignar Permisos

**Opción A: Attach Policies Directly (Más rápido)**

Selecciona estas políticas gestionadas:

```
✓ AWSAmplifyFullAccess
✓ AmazonEC2FullAccess
✓ AmazonS3FullAccess
✓ CloudFrontFullAccess
✓ AmazonSESFullAccess
✓ CloudWatchLogsFullAccess
✓ AWSCloudFormationReadOnlyAccess
```

**Opción B: Create Inline Policy (Permisos mínimos - Recomendado)**

Click "Create inline policy" → JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "amplify:*",
        "ec2:Describe*",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "ses:SendEmail",
        "ses:SendRawEmail",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

**Name:** `HappyHubManagementPolicy`

**Click:** Next

### Paso 4: Tags (Opcional)

```
Key: Project
Value: HappyHub

Key: Environment
Value: Production
```

**Click:** Next

### Paso 5: Review y Crear

1. **Review:** Verifica permisos
2. **Click:** "Create user"

### Paso 6: Guardar Credenciales

**⚠️ CRÍTICO - Solo se muestran UNA VEZ:**

```
Access key ID: AKIAXXXXXXXXXXXXXXXX
Secret access key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Download .csv** o copia a un lugar seguro.

---

## 💻 Configurar en Tu Terminal

### Opción 1: AWS CLI Profile

```bash
aws configure --profile happyhub-admin
```

**Introduce:**
```
AWS Access Key ID: [tu access key]
AWS Secret Access Key: [tu secret key]
Default region name: eu-west-1
Default output format: json
```

### Opción 2: Usar Script Automático

**Ejecuta:**
```bash
./scripts/aws-cli-setup.sh
```

Selecciona crear nuevo perfil y sigue instrucciones.

---

## ✅ Verificar Configuración

**Test acceso:**

```bash
# Ver tu identidad
aws sts get-caller-identity --profile happyhub-admin

# Debe mostrar:
# {
#   "UserId": "AIDAXXXXXXXXX",
#   "Account": "128959995116",
#   "Arn": "arn:aws:iam::128959995116:user/happyhub-admin"
# }
```

**Test permisos:**

```bash
# List S3 buckets
aws s3 ls --profile happyhub-admin

# List EC2 instances
aws ec2 describe-instances --profile happyhub-admin --region eu-west-1

# List Amplify apps
aws amplify list-apps --profile happyhub-admin --region eu-west-1
```

---

## 📝 Guardar Credenciales

**Añade a `.env.local`:**

```bash
# HappyHub Admin User (for AWS operations)
AWS_ADMIN_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_ADMIN_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_ADMIN_REGION=eu-west-1
```

**O en `~/.aws/credentials`:**

```ini
[happyhub-admin]
aws_access_key_id = AKIAXXXXXXXXXXXXXXXX
aws_secret_access_key = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
region = eu-west-1
```

---

## 🔒 Seguridad

**Best Practices:**

1. ✅ **MFA (Multi-Factor Auth):**
   - IAM → Users → happyhub-admin → Security credentials
   - Assign MFA device

2. ✅ **Least Privilege:**
   - No uses políticas *FullAccess si no son necesarias
   - Usa políticas específicas por servicio

3. ✅ **Rotate Keys:**
   - Cada 90 días crea nuevas access keys
   - Elimina las antiguas

4. ✅ **No Commit Credentials:**
   - `.env.local` en .gitignore ✓
   - Nunca subas access keys a GitHub

---

## 🎯 Usuarios IAM Existentes

**Ya tienes configurados:**

1. **edugarciac** - Application user (en .env.local)
2. **happyhub-cli** - CLI operations (en ~/.aws/credentials)

**¿Necesitas un tercer usuario o quieres verificar/mejorar los existentes?**

---

## 💡 Recomendación

**Para uso personal de AWS Console y CLI:**
- Usa **happyhub-cli** (ya configurado)
- Comando: `aws --profile happyhub-cli <comando>`

**Para crear nuevo usuario:**
- Sigue la guía de arriba
- Llámalo `happyhub-admin` o tu nombre
- Configura MFA para mayor seguridad

---

**¿Quieres que te ayude a:**
- **A) Crear usuario nuevo** (5 min)
- **B) Verificar permisos de usuarios existentes**
- **C) Configurar MFA** en usuario existente

**¿Cuál prefieres?**