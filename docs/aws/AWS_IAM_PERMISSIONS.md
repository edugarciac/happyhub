# AWS IAM Permissions - HappyHub

Guía para configurar permisos IAM para usuarios del proyecto HappyHub.

## Estado Actual

### Usuario happyhub-cli
- **User ARN**: `arn:aws:iam::128959995116:user/happyhub-cli`
- **Account**: 128959995116
- **Región**: eu-west-1
- **Estado**: ✅ Autenticado, ✅ Permisos IAM configurados

### Permisos Verificados (2025-02-18)
- ✅ **S3**: ListBuckets, GetBucketLocation, acceso al bucket `happyhub-assets-prod`
- ✅ **EC2**: DescribeRegions, DescribeInstances (acceso de lectura)
- ✅ **STS**: GetCallerIdentity (verificación de identidad)
- ⚠️ **IAM**: Sin permisos (normal para usuarios no-admin, no crítico)

### Permisos Necesarios

El usuario `happyhub-cli` necesita permisos para gestionar la infraestructura de HappyHub. Según el plan de arquitectura, necesita acceso a:

#### Servicios Core
- **S3**: Gestión de buckets y objetos para media storage
- **EC2**: Gestión de instancias para n8n workflows
- **RDS/Aurora**: Gestión de base de datos PostgreSQL
- **Lambda**: Gestión de funciones serverless
- **CloudFront**: Gestión de distribución CDN

#### Servicios de AI/ML
- **Bedrock**: Acceso a Claude models
- **Rekognition**: Análisis de imágenes y face detection

#### Servicios de Comunicación
- **SES**: Envío de emails transaccionales
- **SNS**: Notificaciones push

#### Servicios de Gestión
- **IAM**: Gestión de roles y políticas (limitado)
- **CloudWatch**: Logs y métricas
- **Cost Explorer**: Monitoreo de costos
- **Budgets**: Alertas de presupuesto

## Políticas IAM Recomendadas

### Opción 1: Política Mínima (Recomendada para Desarrollo)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::happyhub-*",
        "arn:aws:s3:::happyhub-*/*"
      ]
    },
    {
      "Sid": "EC2BasicAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeKeyPairs"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RDSBasicAccess",
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LambdaBasicAccess",
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions",
        "lambda:GetFunction"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CostExplorerAccess",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}
```

### Opción 2: Política Completa (Para Administración)

Usar política AWS managed: `PowerUserAccess`
- Permite gestión completa de servicios
- No permite gestión de IAM (seguridad adicional)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "NotAction": [
        "iam:*",
        "organizations:*",
        "account:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Cómo Añadir Permisos

### Método 1: AWS Console (Más Fácil)

1. Ir a [IAM Console](https://console.aws.amazon.com/iam/)
2. Click en "Users" → Buscar "happyhub-cli"
3. Click en "Add permissions" → "Attach policies directly"
4. Opciones:
   - Para desarrollo: Crear política custom con JSON de "Opción 1"
   - Para admin: Buscar y añadir "PowerUserAccess"
5. Click "Next" → "Add permissions"

### Método 2: AWS CLI (Desde otro usuario con permisos admin)

```bash
# Crear política custom
aws iam create-policy \
  --policy-name HappyHubDeveloperPolicy \
  --policy-document file://iam-policy.json

# Adjuntar política al usuario
aws iam attach-user-policy \
  --user-name happyhub-cli \
  --policy-arn arn:aws:iam::128959995116:policy/HappyHubDeveloperPolicy

# O usar política managed
aws iam attach-user-policy \
  --user-name happyhub-cli \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

## Verificar Permisos

Una vez configurados los permisos, verificar con:

```bash
# Test S3 access
aws --profile happyhub-cli s3 ls

# Test EC2 access
aws --profile happyhub-cli ec2 describe-regions

# Test identity
aws --profile happyhub-cli sts get-caller-identity

# Listar políticas del usuario
aws --profile happyhub-cli iam list-attached-user-policies --user-name happyhub-cli
```

## Permisos por Fase de Desarrollo

### Fase 1: Setup Inicial (Actual)
**Permisos necesarios:**
- S3 básico
- EC2 describe (lectura)
- RDS describe (lectura)
- Cost Explorer

**Política recomendada:** Opción 1 (Política Mínima)

### Fase 2: Desarrollo Activo
**Permisos adicionales:**
- EC2 create/start/stop
- RDS create/modify
- Lambda create/update/invoke
- CloudFront create/update

**Política recomendada:** PowerUserAccess

### Fase 3: Producción
**Permisos adicionales:**
- Bedrock invoke
- Rekognition detect
- SES send
- SNS publish

**Política recomendada:** Custom policy con permisos específicos por servicio

## Seguridad Best Practices

### 1. Principio de Menor Privilegio
- Empezar con permisos mínimos
- Añadir permisos según necesidad
- Revisar y eliminar permisos no usados

### 2. Rotación de Credenciales
```bash
# Crear nuevas credenciales
aws iam create-access-key --user-name happyhub-cli

# Eliminar credenciales antiguas (después de actualizar)
aws iam delete-access-key --user-name happyhub-cli --access-key-id OLD_KEY_ID
```

### 3. Monitoreo de Actividad
- Habilitar CloudTrail para auditoría
- Revisar AWS Cost Explorer semanalmente
- Configurar alertas de presupuesto

### 4. MFA (Multi-Factor Authentication)
Recomendado para operaciones sensibles:
```bash
# Habilitar MFA para el usuario
aws iam enable-mfa-device --user-name happyhub-cli --serial-number arn:aws:iam::128959995116:mfa/happyhub-cli --authentication-code1 123456 --authentication-code2 789012
```

## Troubleshooting

### Error: "User is not authorized to perform..."

**Causa:** El usuario no tiene permisos IAM para esa acción.

**Solución:**
1. Verificar políticas adjuntas:
   ```bash
   aws iam list-attached-user-policies --user-name happyhub-cli
   ```
2. Añadir política con permisos necesarios (ver secciones anteriores)

### Error: "Access Denied"

**Causa:** Puede ser credenciales incorrectas o permisos insuficientes.

**Solución:**
1. Verificar autenticación:
   ```bash
   aws --profile happyhub-cli sts get-caller-identity
   ```
2. Si autenticación funciona, añadir permisos IAM

## Próximos Pasos

1. ✅ Credenciales configuradas
2. ✅ Permisos IAM configurados (S3, EC2, STS access verified 2025-02-18)
3. ✅ Bucket S3 creado: `happyhub-assets-prod` (us-east-1)
4. Pendiente: Configurar billing alerts
5. Pendiente: Crear bucket en eu-west-1 (región primaria)
6. Pendiente: Crear infraestructura adicional (EC2, Aurora)

## Referencias

- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS Managed Policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html)
- [IAM Policy Simulator](https://policysim.aws.amazon.com/)
