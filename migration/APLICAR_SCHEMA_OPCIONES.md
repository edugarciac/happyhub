# Opciones para Aplicar Schema SQL a Aurora

Aurora está creado y corriendo, pero está en subnets privadas (no accesible desde tu Mac directamente).

## ✅ Lo que YA está hecho

- ✅ Aurora Serverless v2 cluster creado
- ✅ DB Instance creada y disponible
- ✅ Security Group configurado
- ✅ Subnet Group creado (3 AZ)
- ✅ Endpoint: `happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com`
- ✅ Password generada y guardada
- ✅ Variables de entorno en `.env.local`

**Falta**: Aplicar `schema.sql` y `seed-data.sql`

---

## Opción A: Aplicar desde EC2 n8n (RÁPIDO - 10 min)

EC2 n8n tiene acceso interno a la VPC y puede conectarse a Aurora.

### A1. Necesitas SSH Key

**Si NO tienes la key**:

```bash
# Descargar key desde AWS Console
# 1. Ve a: https://eu-west-1.console.aws.amazon.com/ec2/home?region=eu-west-1#KeyPairs
# 2. Si "happyhub-key" no existe, créala:
aws --profile happyhub-cli ec2 create-key-pair \
  --key-name happyhub-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/happyhub-key.pem

chmod 400 ~/.ssh/happyhub-key.pem
```

### A2. Conectar a EC2 y Aplicar Schema

```bash
# 1. Copiar archivos SQL a EC2
scp -i ~/.ssh/happyhub-key.pem migration/schema.sql ubuntu@34.243.177.162:/tmp/
scp -i ~/.ssh/happyhub-key.pem migration/seed-data.sql ubuntu@34.243.177.162:/tmp/

# 2. Conectar a EC2
ssh -i ~/.ssh/happyhub-key.pem ubuntu@34.243.177.162

# 3. Dentro de EC2, instalar psql
sudo apt-get update
sudo apt-get install -y postgresql-client

# 4. Conectar a Aurora y aplicar schema
export DB_ENDPOINT="happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com"
export DB_PASSWORD="c0MAkvDuZ6yWhfUUzgMh"

psql -h $DB_ENDPOINT -U dbadmin -d happyhub << EOF
$(cat /tmp/schema.sql)
EOF

psql -h $DB_ENDPOINT -U dbadmin -d happyhub << EOF
$(cat /tmp/seed-data.sql)
EOF

# 5. Verificar
psql -h $DB_ENDPOINT -U dbadmin -d happyhub -c "\dt"
psql -h $DB_ENDPOINT -U dbadmin -d happyhub -c "SELECT COUNT(*) FROM users;"

# 6. Salir de EC2
exit
```

---

## Opción B: Configurar Subnets Públicas (COMPLEJO - 1-2 horas)

Recrear el cluster con subnets públicas.

### B1. Eliminar Cluster Actual

```bash
# Eliminar instancia
aws --profile happyhub-cli rds delete-db-instance \
  --db-instance-identifier happyhub-db-instance \
  --skip-final-snapshot \
  --region eu-west-1

# Esperar
aws --profile happyhub-cli rds wait db-instance-deleted \
  --db-instance-identifier happyhub-db-instance \
  --region eu-west-1

# Eliminar cluster
aws --profile happyhub-cli rds delete-db-cluster \
  --db-cluster-identifier happyhub-db-cluster \
  --skip-final-snapshot \
  --region eu-west-1
```

### B2. Crear Subnets Públicas

```bash
# Obtener Internet Gateway
IGW_ID=$(aws --profile happyhub-cli ec2 describe-internet-gateways \
  --region eu-west-1 \
  --filters "Name=attachment.vpc-id,Values=vpc-2815ca4d" \
  --query 'InternetGateways[0].InternetGatewayId' \
  --output text)

# Crear subnet pública en cada AZ
aws --profile happyhub-cli ec2 create-subnet \
  --vpc-id vpc-2815ca4d \
  --cidr-block 172.31.96.0/20 \
  --availability-zone eu-west-1a \
  --region eu-west-1

# ... repetir para eu-west-1b y eu-west-1c con diferentes CIDR

# Configurar route tables...
# (Proceso complejo, no recomendado para ahora)
```

---

## Opción C: Usar AWS RDS Query Editor (MÁS FÁCIL)

AWS Console tiene un Query Editor web que funciona sin configuración de red.

### C1. Abrir RDS Query Editor

1. Ve a: https://eu-west-1.console.aws.amazon.com/rds/home?region=eu-west-1#query-editor:
2. Selecciona cluster: `happyhub-db-cluster`
3. Database name: `happyhub`
4. Username: `dbadmin`
5. Password: `c0MAkvDuZ6yWhfUUzgMh`

### C2. Habilitar Data API (Primero)

```bash
# Habilitar HTTP endpoint en el cluster
aws --profile happyhub-cli rds modify-db-cluster \
  --db-cluster-identifier happyhub-db-cluster \
  --enable-http-endpoint \
  --apply-immediately \
  --region eu-west-1
```

Esperar 2-3 minutos y refrescar Query Editor.

### C3. Copiar y Pegar SQL

1. Abrir `migration/schema.sql` en tu editor
2. Copiar TODO el contenido
3. Pegar en Query Editor
4. Click "Run"
5. Repetir con `migration/seed-data.sql`

---

## 🎯 Recomendación

**Para continuar rápido**: Usa **Opción C** (Query Editor) o **Opción A** (EC2 si tienes SSH key)

**Para producción**: Después configura correctamente las subnets (Opción B)

---

## 📝 Estado Actual

```
✅ Aurora Cluster: happyhub-db-cluster (CREADO)
✅ DB Instance: happyhub-db-instance (CREADA)
✅ Endpoint: happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com
✅ Database: happyhub
✅ User: dbadmin
✅ Password: c0MAkvDuZ6yWhfUUzgMh (guardada en migration/.db-password)
✅ Security Group: sg-006dd0152ea5377bf
⚠️  Schema SQL: Pendiente de aplicar
⚠️  Seed Data: Pendiente de aplicar
```

---

## ➡️ Siguiente Paso

Elige una opción y aplica el schema. Luego:

```bash
# Marcar progreso
echo "✅ Fase 1 schema aplicado: $(date)" >> migration/progress.log

# Continuar con Fase 2
cat migration/FASE_2_N8N.md
```

¿Qué opción prefieres? ¿Tienes SSH key para EC2? ¿O prefieres usar Query Editor desde AWS Console?
