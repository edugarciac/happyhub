# Aplicar Schema - Pasos Simples (Sin SSH Key Necesaria)

**Objetivo**: Aplicar schema.sql y seed-data.sql a Aurora PostgreSQL

**Método**: AWS Systems Manager - Run Command (sin necesidad de SSH key)

**Duración**: 10 minutos

---

## 🚀 Método 1: AWS Run Command (MÁS FÁCIL - Sin SSH)

### Paso 1: Instalar PostgreSQL en EC2

```bash
aws --profile happyhub-cli ssm send-command \
  --instance-ids i-00e6ad6229322f4f3 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo apt-get update -y && sudo apt-get install -y postgresql-client"]' \
  --region eu-west-1 \
  --output text \
  --query 'Command.CommandId'
```

Guarda el Command ID que te devuelve.

### Paso 2: Verificar que terminó

```bash
# Reemplaza COMMAND_ID con el ID del paso anterior
aws --profile happyhub-cli ssm get-command-invocation \
  --command-id <COMMAND_ID> \
  --instance-id i-00e6ad6229322f4f3 \
  --region eu-west-1 \
  --query 'Status'
```

Espera hasta que diga "Success".

### Paso 3: Crear Script SQL en EC2

```bash
# Crear archivo con schema SQL en EC2
aws --profile happyhub-cli ssm send-command \
  --instance-ids i-00e6ad6229322f4f3 \
  --document-name "AWS-RunShellScript" \
  --parameters file://migration/ssm-install-schema.json \
  --region eu-west-1
```

**Problema**: Los archivos SQL son muy grandes para enviarse así.

---

## 🎯 Método 2: Via S3 (MÁS PRÁCTICO)

### Paso 1: Subir archivos SQL a S3

```bash
# Subir schema.sql
aws --profile happyhub-cli s3 cp migration/schema.sql \
  s3://happyhub-assets-prod/migration/schema.sql

# Subir seed-data.sql
aws --profile happyhub-cli s3 cp migration/seed-data.sql \
  s3://happyhub-assets-prod/migration/seed-data.sql

echo "✅ Archivos subidos a S3"
```

### Paso 2: Descargar y Ejecutar desde EC2

```bash
# Ejecutar comando en EC2 que:
# 1. Instala psql
# 2. Descarga SQL desde S3
# 3. Aplica a Aurora

aws --profile happyhub-cli ssm send-command \
  --instance-ids i-00e6ad6229322f4f3 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "sudo apt-get update -y",
    "sudo apt-get install -y postgresql-client awscli",
    "aws s3 cp s3://happyhub-assets-prod/migration/schema.sql /tmp/schema.sql",
    "aws s3 cp s3://happyhub-assets-prod/migration/seed-data.sql /tmp/seed-data.sql",
    "export PGPASSWORD=c0MAkvDuZ6yWhfUUzgMh",
    "psql -h happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com -U dbadmin -d happyhub -f /tmp/schema.sql",
    "psql -h happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com -U dbadmin -d happyhub -f /tmp/seed-data.sql",
    "psql -h happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com -U dbadmin -d happyhub -c \"\\dt\"",
    "echo Schema aplicado correctamente!"
  ]' \
  --region eu-west-1 \
  --query 'Command.CommandId' \
  --output text
```

Guarda el Command ID.

### Paso 3: Ver output

```bash
# Reemplaza COMMAND_ID
aws --profile happyhub-cli ssm get-command-invocation \
  --command-id <COMMAND_ID> \
  --instance-id i-00e6ad6229322f4f3 \
  --region eu-west-1 \
  --query '[Status,StandardOutputContent]' \
  --output text
```

---

## 🎯 Método 3: Aplicar via API desde tu Next.js (EL MÁS SIMPLE)

### Ya preparé todo. Solo necesitas:

1. **Verificar que Next.js pueda usar SSL para Aurora**
2. **Ejecutar el API endpoint**

```bash
# Actualizar el script para intentar sin SSL
# (Aurora en VPC privada puede no requerir SSL desde dentro de AWS)
```

---

## ✨ EJECUTEMOS MÉTODO 2 AHORA (Via S3)

Es el más confiable. Voy a ejecutar los comandos por ti.

¿Continuamos?
