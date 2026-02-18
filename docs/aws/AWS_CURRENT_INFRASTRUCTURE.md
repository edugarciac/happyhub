# AWS Current Infrastructure - HappyHub

Documentación del estado actual de la infraestructura AWS desplegada para HappyHub.

**Última actualización**: 2025-02-18

## Cuenta AWS

- **Account ID**: 128959995116
- **Región Principal**: eu-west-1 (Europa - Irlanda)
- **Usuario CLI**: happyhub-cli
- **Estado**: ✅ Operacional

## Recursos Desplegados

### 1. EC2 - Compute (n8n Server)

**✅ RUNNING**

```
Instance ID:    i-00e6ad6229322f4f3
Instance Type:  t3.micro (2 vCPU, 1 GB RAM)
Estado:         running
Región:         eu-west-1
Nombre:         n8n-server
Public IP:      34.243.177.162
Private IP:     172.31.0.95
Launch Date:    2025-12-23 14:09:29 UTC
OS:             Ubuntu 22.04 LTS (presumido)
```

**Coste Estimado**: ~8€/mes (t3.micro on-demand)

**Propósito**: Servidor de automatización n8n para orquestar:
- Workflows de reservas
- Integración con Google Calendar
- Integración con Airtable
- Envío de emails
- Generación de payment links de Stripe

**Acceso**:
```bash
# SSH (requiere key pair configurada)
ssh -i ~/.ssh/happyhub-key.pem ubuntu@34.243.177.162

# O usando AWS Session Manager (más seguro)
aws --profile happyhub-cli ssm start-session --target i-00e6ad6229322f4f3 --region eu-west-1
```

### 2. S3 - Storage

**✅ DEPLOYED**

```
Bucket Name:    happyhub-assets-prod
Región:         us-east-1 (N. Virginia)
Created:        2025-12-25 23:25:49 UTC
Objects:        0 (vacío)
Estado:         activo, listo para usar
```

**Coste Estimado**: ~0.023€ por GB/mes almacenado + transferencia

**Propósito**: Almacenamiento de assets del proyecto (imágenes, documentos, media)

**Uso**:
```bash
# Listar contenido
aws --profile happyhub-cli s3 ls s3://happyhub-assets-prod/

# Subir archivo
aws --profile happyhub-cli s3 cp file.jpg s3://happyhub-assets-prod/images/

# Sincronizar carpeta
aws --profile happyhub-cli s3 sync ./public s3://happyhub-assets-prod/public/
```

### 3. CloudFront - CDN

**⚠️ Estado Desconocido**

El comando CloudFront no retornó resultados claros. Requiere investigación adicional.

**Verificación pendiente**:
```bash
aws --profile happyhub-cli cloudfront list-distributions
```

## Recursos NO Desplegados

### Database
- ❌ **Aurora PostgreSQL**: No desplegado aún
- Alternativa actual: Airtable (externo, no AWS)

### AI/ML Services
- ❌ **Bedrock**: No configurado aún
- ❌ **Rekognition**: No configurado aún

### Serverless
- ❌ **Lambda**: No hay funciones desplegadas

### Communication
- ❌ **SES**: No configurado
- ❌ **SNS**: No configurado

## Costes Actuales

**Estimación Mensual**:

| Servicio | Recurso | Coste/mes |
|----------|---------|-----------|
| EC2 | t3.micro (n8n-server) | ~8€ |
| S3 | happyhub-assets-prod (vacío) | ~0€ |
| **TOTAL** | | **~8€/mes** |

**Nota**: Coste muy por debajo del presupuesto de 100€/mes.

## Permisos IAM Configurados

Usuario **happyhub-cli** tiene acceso a:

- ✅ S3 (ListBuckets, GetObject, PutObject)
- ✅ EC2 (DescribeInstances, DescribeRegions)
- ✅ STS (GetCallerIdentity)
- ⚠️ IAM (sin acceso, normal para usuarios no-admin)

Ver detalles completos en: `AWS_IAM_PERMISSIONS.md`

## Network & Security

### VPC
- **VPC ID**: Default VPC (presumido)
- **Subnet**: Default subnet en eu-west-1

### Security Groups
Requiere verificación:
```bash
aws --profile happyhub-cli ec2 describe-security-groups --region eu-west-1
```

### Key Pairs
Requiere verificación:
```bash
aws --profile happyhub-cli ec2 describe-key-pairs --region eu-west-1
```

## Monitoring & Alerts

### CloudWatch
- ⚠️ Estado desconocido
- **Acción requerida**: Configurar alarmas básicas (CPU, memoria, disco)

### Billing Alerts
- ⚠️ **Pendiente configuración**
- **Acción requerida**: Configurar alertas a 50€, 75€, 90€

## Backup Strategy

### EC2 (n8n-server)
- ⚠️ **Backups manuales pendientes**
- **Recomendación**: Configurar AMI snapshots automáticos

### S3
- ✅ S3 tiene versionado inherente
- ⚠️ **Acción requerida**: Habilitar versionado explícito y lifecycle policies

## Próximos Pasos Recomendados

### Corto Plazo (Esta Semana)

1. **Configurar Billing Alerts** (crítico)
   ```bash
   aws --profile happyhub-cli budgets create-budget \
     --account-id 128959995116 \
     --budget file://budget-config.json
   ```

2. **Documentar Acceso n8n**
   - Verificar URL de n8n: http://34.243.177.162:5678 (presumido)
   - Documentar credenciales (en archivo seguro)
   - Verificar workflows existentes

3. **Configurar Security Groups**
   - Revisar reglas actuales
   - Restringir acceso SSH solo a IPs conocidas
   - Documentar puertos abiertos

4. **Habilitar CloudWatch Alarms**
   - CPU > 80%
   - Disco > 80%
   - Estado de instancia

### Medio Plazo (Este Mes)

1. **Backup Strategy**
   - Configurar AMI snapshots automáticos (diarios, 7 días retención)
   - Habilitar versionado en S3
   - Probar restore process

2. **Optimización de Costes**
   - Evaluar Reserved Instances (puede ahorrar 30-40%)
   - Configurar auto-shutdown para instancias dev/staging

3. **Migrar Bucket S3 a eu-west-1**
   - Crear nuevo bucket: happyhub-assets-prod-eu
   - Configurar CloudFront distribution
   - Lifecycle policies

### Largo Plazo (Próximos 3 Meses)

1. **Despliegue de Aurora PostgreSQL**
   - Migrar de Airtable a Aurora Serverless v2
   - Configurar backups automáticos
   - Point-in-time recovery

2. **Habilitar Bedrock**
   - Solicitar acceso a Claude models
   - Implementar AI assistant para planificación de eventos
   - Content generation para marketing

3. **Implementar Lambda Functions**
   - Image resizing on upload
   - Webhook processors
   - Scheduled tasks (reports, cleanup)

## Comandos Útiles

### Gestión de Instancia EC2
```bash
# Ver estado
aws --profile happyhub-cli ec2 describe-instances --region eu-west-1 --instance-ids i-00e6ad6229322f4f3

# Stop instance (para ahorrar costes)
aws --profile happyhub-cli ec2 stop-instances --region eu-west-1 --instance-ids i-00e6ad6229322f4f3

# Start instance
aws --profile happyhub-cli ec2 start-instances --region eu-west-1 --instance-ids i-00e6ad6229322f4f3

# Crear AMI backup
aws --profile happyhub-cli ec2 create-image --region eu-west-1 \
  --instance-id i-00e6ad6229322f4f3 \
  --name "n8n-server-backup-$(date +%Y%m%d)" \
  --description "Backup of n8n server"
```

### Gestión de S3
```bash
# Ver tamaño del bucket
aws --profile happyhub-cli s3 ls s3://happyhub-assets-prod --recursive --summarize --human-readable

# Habilitar versionado
aws --profile happyhub-cli s3api put-bucket-versioning \
  --bucket happyhub-assets-prod \
  --versioning-configuration Status=Enabled

# Configurar lifecycle policy (mover a Glacier después de 90 días)
aws --profile happyhub-cli s3api put-bucket-lifecycle-configuration \
  --bucket happyhub-assets-prod \
  --lifecycle-configuration file://lifecycle-policy.json
```

### Monitoreo de Costes
```bash
# Ver costes del mes actual
aws --profile happyhub-cli ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics UnblendedCost

# Forecast próximo mes
aws --profile happyhub-cli ce get-cost-forecast \
  --time-period Start=$(date -v+1d +%Y-%m-%d),End=$(date -v+1m +%Y-%m-%d) \
  --metric UNBLENDED_COST \
  --granularity MONTHLY
```

## Referencias

- [EC2 Pricing](https://aws.amazon.com/ec2/pricing/)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
- [AWS Backup Best Practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/backup-recovery/backup.html)

## Contactos

**AWS Support**:
- Basic Support (incluido gratis)
- Contacto vía AWS Console

**Administradores HappyHub**:
- Eduardo García (e.garcia.casas@gmail.com)
