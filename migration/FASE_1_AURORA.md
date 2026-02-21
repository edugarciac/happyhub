# Fase 1: Crear Aurora PostgreSQL - Guía Paso a Paso

**Objetivo**: Crear cluster Aurora Serverless v2 y aplicar schema inicial.

**Duración estimada**: 2-3 horas

**Coste**: ~25€/mes (0€ con crédito AWS)

---

## 🎯 Resultado Final

Al terminar esta fase tendrás:
- ✅ Cluster Aurora PostgreSQL corriendo en eu-west-1
- ✅ Base de datos `happyhub` con todas las tablas
- ✅ Demo users insertados
- ✅ Event types predefinidos
- ✅ Conexión verificada desde tu Mac

---

## 📋 Pre-requisitos

- [ ] AWS CLI configurado (`aws --profile happyhub-cli sts get-caller-identity`)
- [ ] Permisos IAM para RDS
- [ ] VPC default en eu-west-1 (ya existe)
- [ ] PostgreSQL client instalado localmente

### Instalar PostgreSQL client (si no lo tienes)

```bash
# macOS
brew install postgresql@15

# Verificar instalación
psql --version
```

---

## 🔐 Paso 1: Preparar Security Groups

### 1.1. Obtener VPC default

```bash
# Obtener VPC ID
VPC_ID=$(aws --profile happyhub-cli ec2 describe-vpcs \
  --region eu-west-1 \
  --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

echo "VPC ID: $VPC_ID"
```

### 1.2. Crear Security Group para Aurora

```bash
# Crear security group
SG_ID=$(aws --profile happyhub-cli ec2 create-security-group \
  --group-name happyhub-aurora-sg \
  --description "Security group for HappyHub Aurora PostgreSQL" \
  --vpc-id $VPC_ID \
  --region eu-west-1 \
  --query 'GroupId' \
  --output text)

echo "Security Group ID: $SG_ID"

# Guardar para después
echo $SG_ID > migration/aurora-sg-id.txt
```

### 1.3. Permitir acceso desde tu IP y EC2 n8n

```bash
# Obtener tu IP pública
MY_IP=$(curl -s ifconfig.me)
echo "Tu IP: $MY_IP"

# Permitir acceso desde tu IP (para desarrollo)
aws --profile happyhub-cli ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr $MY_IP/32 \
  --region eu-west-1

# Permitir acceso desde EC2 n8n (IP privada: 172.31.0.95)
aws --profile happyhub-cli ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 172.31.0.0/16 \
  --region eu-west-1 \
  --description "Access from EC2 instances in VPC"

echo "✅ Security group configurado"
```

---

## 🗄️ Paso 2: Crear Aurora Serverless v2 Cluster

### 2.1. Obtener subnet IDs

```bash
# Obtener subnets de la VPC
SUBNET_IDS=$(aws --profile happyhub-cli ec2 describe-subnets \
  --region eu-west-1 \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' \
  --output text)

echo "Subnets: $SUBNET_IDS"
```

### 2.2. Crear DB Subnet Group

```bash
# Convertir SUBNET_IDS a array
SUBNET_ARRAY=(${SUBNET_IDS})

# Crear subnet group
aws --profile happyhub-cli rds create-db-subnet-group \
  --db-subnet-group-name happyhub-subnet-group \
  --db-subnet-group-description "HappyHub Aurora Subnet Group" \
  --subnet-ids ${SUBNET_ARRAY[@]} \
  --region eu-west-1

echo "✅ Subnet group creado"
```

### 2.3. Generar password segura

```bash
# Generar password aleatoria
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
echo "Password generada: $DB_PASSWORD"

# Guardar de forma segura
echo $DB_PASSWORD > migration/.db-password
chmod 600 migration/.db-password

echo "⚠️  IMPORTANTE: Guarda esta password en un lugar seguro"
echo "Password guardada en: migration/.db-password"
```

### 2.4. Crear Aurora Cluster

```bash
# Crear cluster Aurora Serverless v2
aws --profile happyhub-cli rds create-db-cluster \
  --db-cluster-identifier happyhub-db-cluster \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username dbadmin \
  --master-user-password "$DB_PASSWORD" \
  --database-name happyhub \
  --vpc-security-group-ids $SG_ID \
  --db-subnet-group-name happyhub-subnet-group \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=2 \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --enable-cloudwatch-logs-exports postgresql \
  --region eu-west-1

echo "✅ Cluster creado, esperando disponibilidad..."
```

### 2.5. Esperar a que cluster esté disponible

```bash
# Esperar hasta 10 minutos
aws --profile happyhub-cli rds wait db-cluster-available \
  --db-cluster-identifier happyhub-db-cluster \
  --region eu-west-1

echo "✅ Cluster disponible"
```

### 2.6. Crear DB Instance en el Cluster

```bash
# Crear instancia serverless dentro del cluster
aws --profile happyhub-cli rds create-db-instance \
  --db-instance-identifier happyhub-db-instance \
  --db-cluster-identifier happyhub-db-cluster \
  --db-instance-class db.serverless \
  --engine aurora-postgresql \
  --region eu-west-1

echo "✅ Instancia creada, esperando disponibilidad..."

# Esperar hasta 5 minutos
aws --profile happyhub-cli rds wait db-instance-available \
  --db-instance-identifier happyhub-db-instance \
  --region eu-west-1

echo "✅ Aurora PostgreSQL completamente desplegado"
```

---

## 📍 Paso 3: Obtener Endpoint de Conexión

### 3.1. Obtener información del cluster

```bash
# Obtener endpoint
DB_ENDPOINT=$(aws --profile happyhub-cli rds describe-db-clusters \
  --db-cluster-identifier happyhub-db-cluster \
  --region eu-west-1 \
  --query 'DBClusters[0].Endpoint' \
  --output text)

echo "Database Endpoint: $DB_ENDPOINT"

# Guardar para después
echo $DB_ENDPOINT > migration/aurora-endpoint.txt
```

### 3.2. Crear connection string

```bash
# Leer password guardada
DB_PASSWORD=$(cat migration/.db-password)

# Crear connection string
CONNECTION_STRING="postgresql://dbadmin:${DB_PASSWORD}@${DB_ENDPOINT}:5432/happyhub"

echo "Connection String:"
echo $CONNECTION_STRING

# Guardar
echo $CONNECTION_STRING > migration/connection-string.txt
chmod 600 migration/connection-string.txt

echo "⚠️  Connection string guardada en: migration/connection-string.txt"
```

---

## 🔧 Paso 4: Crear Schema de Base de Datos

### 4.1. Crear archivo de schema

El archivo ya está creado en `migration/schema.sql`.

Revisa y edita si necesitas cambios:

```bash
# Abrir schema en editor
code migration/schema.sql
# o
nano migration/schema.sql
```

### 4.2. Aplicar schema a la base de datos

```bash
# Conectar y aplicar schema
psql "$CONNECTION_STRING" -f migration/schema.sql

# Si sale error de SSL, usar:
psql "$CONNECTION_STRING?sslmode=require" -f migration/schema.sql
```

Deberías ver:
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
```

### 4.3. Verificar que tablas se crearon

```bash
# Listar tablas
psql "$CONNECTION_STRING?sslmode=require" -c "\dt"
```

Deberías ver:
```
 Schema |     Name      | Type  |  Owner
--------+---------------+-------+---------
 public | users         | table | dbadmin
 public | reservations  | table | dbadmin
 public | providers     | table | dbadmin
 public | services      | table | dbadmin
 public | event_types   | table | dbadmin
```

---

## 🌱 Paso 5: Insertar Datos Iniciales

### 5.1. Crear archivo de seed data

```bash
# Crear archivo
touch migration/seed-data.sql
```

### 5.2. Añadir datos de ejemplo

Edita `migration/seed-data.sql` con:

```sql
-- Demo users
INSERT INTO users (email, password_hash, name, phone, role, created_at) VALUES
('admin@happyhub.es', '$2a$10$xyz...', 'Admin HappyHub', '+34666000000', 'admin', NOW()),
('cliente@happyhub.es', '$2a$10$abc...', 'Cliente Demo', '+34666111111', 'client', NOW()),
('proveedor@happyhub.es', '$2a$10$def...', 'Proveedor Demo', '+34666222222', 'provider', NOW());

-- Event types
INSERT INTO event_types (name, description, icon) VALUES
('Cumpleaños', 'Fiesta de cumpleaños para niños y adultos', '🎂'),
('Comunión', 'Primera comunión', '🕊️'),
('Bautizo', 'Bautizo y celebración', '👶'),
('Boda', 'Enlace matrimonial', '💍'),
('Reunión Familiar', 'Reunión de familia o amigos', '👨‍👩‍👧‍👦'),
('Evento Corporativo', 'Evento de empresa', '💼'),
('Otro', 'Otro tipo de evento', '🎉');

-- Demo providers
INSERT INTO providers (name, service_type, email, phone, description, price_range) VALUES
('Catering Gourmet', 'catering', 'info@cateringgourmet.es', '+34666333333', 'Servicio de catering premium', '500-2000€'),
('DJ Fiesta', 'animacion', 'dj@fiesta.es', '+34666444444', 'DJ profesional para todo tipo de eventos', '200-600€'),
('Globos Mágicos', 'decoracion', 'info@globosmagicos.es', '+34666555555', 'Decoración con globos', '150-500€');

-- Demo reservation (opcional)
INSERT INTO reservations (user_id, event_date, time_slot, event_type, guests, total_price, status, created_at) VALUES
(2, '2025-03-15', 'afternoon', 'Cumpleaños', 25, 185.00, 'pending', NOW());

-- Commit
SELECT 'Seed data insertado correctamente' AS resultado;
```

### 5.3. Aplicar seed data

```bash
# Aplicar datos iniciales
psql "$CONNECTION_STRING?sslmode=require" -f migration/seed-data.sql
```

### 5.4. Verificar datos

```bash
# Ver usuarios
psql "$CONNECTION_STRING?sslmode=require" -c "SELECT id, email, name, role FROM users;"

# Ver tipos de evento
psql "$CONNECTION_STRING?sslmode=require" -c "SELECT * FROM event_types;"

# Ver proveedores
psql "$CONNECTION_STRING?sslmode=require" -c "SELECT id, name, service_type FROM providers;"
```

---

## ✅ Paso 6: Configurar Variables de Entorno

### 6.1. Actualizar .env.local

```bash
# Leer valores
DB_ENDPOINT=$(cat migration/aurora-endpoint.txt)
DB_PASSWORD=$(cat migration/.db-password)

# Añadir a .env.local
cat >> .env.local <<EOF

# Aurora PostgreSQL
DATABASE_URL=postgresql://dbadmin:${DB_PASSWORD}@${DB_ENDPOINT}:5432/happyhub?sslmode=require
DB_HOST=${DB_ENDPOINT}
DB_PORT=5432
DB_NAME=happyhub
DB_USER=dbadmin
DB_PASSWORD=${DB_PASSWORD}
EOF

echo "✅ Variables de entorno actualizadas en .env.local"
```

### 6.2. Crear .env.production (para Amplify)

```bash
# Copiar para producción
cp .env.local .env.production

echo "✅ .env.production creado"
```

---

## 🧪 Paso 7: Testing de Conexión

### 7.1. Test desde psql

```bash
# Conexión interactiva
psql "$CONNECTION_STRING?sslmode=require"

# Dentro de psql:
# \dt          - Listar tablas
# \d users     - Describir tabla users
# SELECT * FROM event_types;
# \q           - Salir
```

### 7.2. Test desde Node.js

Crear archivo de test:

```bash
# Crear test script
cat > migration/test-connection.js <<'EOF'
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    // Test conexión
    const client = await pool.connect();
    console.log('✅ Conexión exitosa');

    // Query de prueba
    const result = await client.query('SELECT COUNT(*) as total FROM users');
    console.log(`✅ Usuarios en DB: ${result.rows[0].total}`);

    // Test event types
    const eventTypes = await client.query('SELECT name FROM event_types');
    console.log(`✅ Tipos de evento: ${eventTypes.rows.map(r => r.name).join(', ')}`);

    client.release();
    await pool.end();
    console.log('✅ Test completado');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

test();
EOF

# Instalar dependencia
npm install pg

# Ejecutar test
source .env.local
node migration/test-connection.js
```

Deberías ver:
```
✅ Conexión exitosa
✅ Usuarios en DB: 3
✅ Tipos de evento: Cumpleaños, Comunión, Bautizo, Boda, Reunión Familiar, Evento Corporativo, Otro
✅ Test completado
```

---

## 📊 Paso 8: Verificación Final

### Checklist Fase 1

- [ ] Aurora cluster creado y disponible
- [ ] Security group configurado correctamente
- [ ] Conexión desde local funciona
- [ ] Todas las tablas creadas (5 tablas)
- [ ] Datos iniciales insertados (users, event_types, providers)
- [ ] Variables de entorno actualizadas (.env.local)
- [ ] Test de conexión desde Node.js exitoso
- [ ] Endpoints y passwords guardados de forma segura

### Verificar costes

```bash
# Ver información del cluster
aws --profile happyhub-cli rds describe-db-clusters \
  --db-cluster-identifier happyhub-db-cluster \
  --region eu-west-1 \
  --query 'DBClusters[0].[ServerlessV2ScalingConfiguration,DBClusterArn]'
```

**Configuración actual**:
- Min Capacity: 0.5 ACU (~12.50€/mes en idle)
- Max Capacity: 2 ACU (escala automático bajo carga)
- Backups: 7 días retención
- Logs: CloudWatch habilitado

---

## 📝 Información para Siguientes Fases

### Connection String
```
Guardado en: migration/connection-string.txt
```

### Endpoints
```
Writer: <guardado en migration/aurora-endpoint.txt>
Port: 5432
Database: happyhub
User: dbadmin
Password: <guardado en migration/.db-password>
```

### Para n8n (Fase 2)
- Host: `<aurora-endpoint>`
- Port: `5432`
- Database: `happyhub`
- User: `dbadmin`
- Password: `<from .db-password>`
- SSL: `require`

---

## 🐛 Troubleshooting

### Error: "timeout" al crear cluster
- **Causa**: Proceso de creación tarda 5-10 minutos
- **Solución**: Esperar, verificar en consola AWS

### Error: "no pg_hba.conf entry" al conectar
- **Causa**: Security group no permite tu IP
- **Solución**:
```bash
aws --profile happyhub-cli ec2 authorize-security-group-ingress \
  --group-id $SG_ID --protocol tcp --port 5432 --cidr $(curl -s ifconfig.me)/32
```

### Error: "password authentication failed"
- **Causa**: Password incorrecta
- **Solución**: Verificar `migration/.db-password`

### Tablas no aparecen después de aplicar schema
- **Causa**: Error en ejecución de SQL
- **Solución**: Revisar output de `psql -f schema.sql`

---

## ➡️ Siguiente Paso

Una vez completada Fase 1:

```bash
# Marcar como completada
echo "✅ Fase 1 completada: $(date)" >> migration/progress.log

# Continuar con Fase 2
cat migration/FASE_2_N8N.md
```

O ejecutar checklist:
```bash
./scripts/migration-checklist.sh
```

---

## 💾 Backup de Configuración

Antes de continuar, backup de configs:

```bash
# Crear backup de archivos importantes
tar -czf migration/backups/fase1-configs-$(date +%Y%m%d).tar.gz \
  migration/aurora-endpoint.txt \
  migration/aurora-sg-id.txt \
  migration/.db-password \
  migration/connection-string.txt \
  .env.local

echo "✅ Backup de configuración creado"
```

¡Fase 1 completada! 🎉
