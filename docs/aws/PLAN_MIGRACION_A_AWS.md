# Plan de Migración: Vercel + Airtable → AWS

Guía completa para migrar HappyHub de Vercel + Airtable a infraestructura AWS.

**Estado Actual (Vercel + Airtable)**:
- Frontend/Backend: Next.js 14 en Vercel
- Base de datos: Airtable (externo)
- Automatización: n8n workflows (ya en AWS EC2)
- Coste: ~20-30€/mes (Vercel Pro + Airtable Pro)

**Estado Objetivo (AWS Full Stack)**:
- Frontend/Backend: Next.js en AWS (Amplify o EC2)
- Base de datos: Aurora PostgreSQL Serverless v2
- Automatización: n8n (ya desplegado en EC2)
- Coste estimado: ~40-50€/mes (más control, escalable)

## Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────┐
│                    USUARIOS                         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│          CloudFront (CDN) + Route53 (DNS)           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│   AWS Amplify (Next.js SSR) o EC2 + NGINX          │
│   - Frontend React                                  │
│   - API Routes (Next.js)                           │
│   - Autenticación JWT                              │
└────────┬──────────────────────┬─────────────────────┘
         │                      │
         ▼                      ▼
┌────────────────┐    ┌──────────────────────┐
│  S3 Buckets    │    │  Aurora PostgreSQL   │
│  - Images      │    │  Serverless v2       │
│  - Documents   │    │  - Users             │
│  - Static      │    │  - Reservations      │
└────────────────┘    │  - Events            │
                      │  - Providers         │
                      └──────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────┐
│          EC2 t3.micro (n8n-server)                  │
│          IP: 34.243.177.162                         │
│   - Workflows automation                            │
│   - Google Calendar integration                     │
│   - Email sending                                   │
│   - Stripe payment links                           │
└─────────────────────────────────────────────────────┘
```

## Fases de Migración

### 📋 Fase 0: Preparación (1-2 días)

**Objetivo**: Backup completo y preparación del entorno.

#### 0.1. Backup de Airtable

```bash
# Exportar datos desde Airtable (manual desde UI)
# Ir a: https://airtable.com/appXXX/tblXXX
# View → Extensions → CSV export
# Guardar en: ./migration/airtable-export/

mkdir -p migration/airtable-export
# Exportar tablas:
# - Reservations
# - Users
# - Providers
# - Services
# - EventTypes
```

#### 0.2. Backup de Vercel

```bash
# Descargar logs y configuración
vercel env pull .env.vercel
vercel logs > migration/vercel-logs.txt
```

#### 0.3. Documentar n8n Workflows

```bash
# Acceder al servidor n8n
ssh -i ~/.ssh/happyhub-key.pem ubuntu@34.243.177.162

# O desde AWS Session Manager
aws --profile happyhub-cli ssm start-session \
  --target i-00e6ad6229322f4f3 \
  --region eu-west-1

# Una vez dentro, backup de workflows n8n
cd /home/ubuntu/.n8n  # (ruta típica)
tar -czf n8n-workflows-backup.tar.gz workflows/
```

#### 0.4. Crear Plan de Rollback

Documentar cómo volver atrás si algo falla:
- Mantener Vercel activo durante 1 semana
- Mantener Airtable activo durante 2 semanas
- Probar en staging antes de producción

---

### 🗄️ Fase 1: Base de Datos (3-5 días)

**Objetivo**: Migrar de Airtable a Aurora PostgreSQL.

#### 1.1. Crear Aurora Serverless v2

```bash
# Crear subnet group (si no existe)
aws --profile happyhub-cli rds create-db-subnet-group \
  --db-subnet-group-name happyhub-subnet-group \
  --db-subnet-group-description "HappyHub Database Subnet Group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy \
  --region eu-west-1

# Crear Aurora Serverless v2 cluster
aws --profile happyhub-cli rds create-db-cluster \
  --db-cluster-identifier happyhub-db-cluster \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username dbadmin \
  --master-user-password 'TuPasswordSegura123!' \
  --database-name happyhub \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name happyhub-subnet-group \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=2 \
  --region eu-west-1

# Crear instancia del cluster
aws --profile happyhub-cli rds create-db-instance \
  --db-instance-identifier happyhub-db-instance \
  --db-cluster-identifier happyhub-db-cluster \
  --db-instance-class db.serverless \
  --engine aurora-postgresql \
  --region eu-west-1
```

**Coste estimado**: ~25€/mes (0.5-2 ACU)

#### 1.2. Diseñar Schema PostgreSQL

Crear archivo `migration/schema.sql`:

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations table
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    guests INTEGER,
    total_price DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    google_calendar_event_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Providers table
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    description TEXT,
    price_range VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table (extras como catering, decoración)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES reservations(id),
    provider_id INTEGER REFERENCES providers(id),
    service_name VARCHAR(255),
    price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'requested'
);

-- Event types
CREATE TABLE event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50)
);

-- Indexes para performance
CREATE INDEX idx_reservations_date ON reservations(event_date);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_users_email ON users(email);
```

#### 1.3. Migrar Datos de Airtable

Crear script `migration/migrate-airtable-to-postgres.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');

// Conectar a Aurora
const pool = new Pool({
  host: 'happyhub-db-cluster.cluster-xxxxx.eu-west-1.rds.amazonaws.com',
  database: 'happyhub',
  user: 'dbadmin',
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Migrar reservations
async function migrateReservations() {
  const reservations = [];

  fs.createReadStream('./migration/airtable-export/reservations.csv')
    .pipe(csv())
    .on('data', (row) => reservations.push(row))
    .on('end', async () => {
      for (const res of reservations) {
        await pool.query(
          `INSERT INTO reservations
          (event_date, time_slot, event_type, guests, total_price, status)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [res.date, res.timeSlot, res.eventType, res.guests, res.price, res.status]
        );
      }
      console.log('✓ Reservations migrated');
    });
}

migrateReservations();
```

Ejecutar migración:

```bash
npm install pg csv-parser
export DB_PASSWORD='TuPasswordSegura123!'
node migration/migrate-airtable-to-postgres.js
```

#### 1.4. Actualizar n8n Workflows

Modificar workflows para usar PostgreSQL en vez de Airtable:

1. Acceder a n8n UI: `http://34.243.177.162:5678`
2. Editar workflow "Reserva con Validación"
3. Reemplazar nodos "Airtable" por nodos "PostgreSQL"
4. Actualizar credenciales PostgreSQL en n8n

**Configuración PostgreSQL en n8n**:
- Host: `happyhub-db-cluster.cluster-xxxxx.eu-west-1.rds.amazonaws.com`
- Port: 5432
- Database: happyhub
- User: dbadmin
- Password: (desde secrets)

---

### 🚀 Fase 2: Frontend/Backend (2-3 días)

**Objetivo**: Migrar Next.js de Vercel a AWS.

#### Opción A: AWS Amplify (Recomendado - Más Fácil)

**Ventajas**:
- Setup automático de CI/CD
- SSR nativo para Next.js
- CDN incluido
- Certificado SSL automático
- ~12€/mes para tráfico bajo

```bash
# Instalar Amplify CLI
npm install -g @aws-amplify/cli

# Configurar Amplify
amplify configure

# Inicializar proyecto
cd ~/Code/happyhub
amplify init

# Añadir hosting
amplify add hosting
# Seleccionar: "Hosting with Amplify Console"
# Seleccionar: "Continuous deployment"

# Conectar con Git
amplify publish
```

**Configuración manual en AWS Console**:

1. Ir a [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. "New app" → "Host web app"
3. Conectar repositorio GitHub
4. Framework: Next.js - SSR
5. Build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
6. Environment variables:
   - `DATABASE_URL`: Aurora connection string
   - `JWT_SECRET`: (copiar de Vercel)
   - `STRIPE_SECRET_KEY`: (copiar de Vercel)
   - `AWS_REGION`: eu-west-1
   - Todas las demás variables de `.env`

7. Deploy!

#### Opción B: EC2 + NGINX (Más Control, Más Trabajo)

```bash
# 1. Crear nueva instancia EC2
aws --profile happyhub-cli ec2 run-instances \
  --image-id ami-0c38b837cd80f13bb \
  --instance-type t3.small \
  --key-name happyhub-key \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=happyhub-app}]' \
  --region eu-west-1

# 2. SSH a la instancia
ssh -i ~/.ssh/happyhub-key.pem ubuntu@<NEW_IP>

# 3. Instalar Node.js y dependencias
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# 4. Clonar repositorio
git clone https://github.com/tu-usuario/happyhub.git /home/ubuntu/happyhub
cd /home/ubuntu/happyhub

# 5. Instalar dependencias y build
npm ci
npm run build

# 6. Configurar PM2 para auto-restart
sudo npm install -g pm2
pm2 start npm --name "happyhub" -- start
pm2 save
pm2 startup

# 7. Configurar NGINX
sudo nano /etc/nginx/sites-available/happyhub
```

Configuración NGINX:

```nginx
server {
    listen 80;
    server_name happyhub.com www.happyhub.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/happyhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d happyhub.com -d www.happyhub.com
```

**Coste EC2**: ~15€/mes (t3.small)

---

### 📦 Fase 3: Storage (1 día)

**Objetivo**: Configurar S3 para assets y CloudFront para CDN.

#### 3.1. Configurar S3 Bucket en eu-west-1

```bash
# Crear bucket en región correcta
aws --profile happyhub-cli s3 mb s3://happyhub-assets-eu-west-1 --region eu-west-1

# Configurar política de bucket
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::happyhub-assets-eu-west-1/public/*"
    }
  ]
}
EOF

aws --profile happyhub-cli s3api put-bucket-policy \
  --bucket happyhub-assets-eu-west-1 \
  --policy file://bucket-policy.json

# Habilitar versionado
aws --profile happyhub-cli s3api put-bucket-versioning \
  --bucket happyhub-assets-eu-west-1 \
  --versioning-configuration Status=Enabled

# Configurar CORS
cat > cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://happyhub.com", "https://www.happyhub.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws --profile happyhub-cli s3api put-bucket-cors \
  --bucket happyhub-assets-eu-west-1 \
  --cors-configuration file://cors-config.json
```

#### 3.2. Crear CloudFront Distribution

```bash
cat > cloudfront-config.json <<EOF
{
  "CallerReference": "happyhub-$(date +%s)",
  "Comment": "HappyHub CDN",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-happyhub-assets",
        "DomainName": "happyhub-assets-eu-west-1.s3.eu-west-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-happyhub-assets",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 86400
  }
}
EOF

aws --profile happyhub-cli cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

#### 3.3. Actualizar Código para Usar S3

Crear `src/lib/s3.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function uploadToS3(file: File, key: string) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: 'happyhub-assets-eu-west-1',
    Key: `uploads/${key}`,
    Body: buffer,
    ContentType: file.type,
  });

  await s3Client.send(command);

  return `https://d1234567890.cloudfront.net/uploads/${key}`;
}
```

---

### 🔧 Fase 4: Configuración (1-2 días)

#### 4.1. Actualizar Variables de Entorno

Crear `.env.production`:

```bash
# Database (Aurora)
DATABASE_URL=postgresql://dbadmin:password@happyhub-db-cluster.cluster-xxxxx.eu-west-1.rds.amazonaws.com:5432/happyhub

# AWS
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY_HERE
S3_BUCKET=happyhub-assets-eu-west-1
CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# n8n (mantener)
N8N_WEBHOOK_URL=http://34.243.177.162:5678/webhook/reservation-request

# Stripe (mantener)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Auth (mantener)
JWT_SECRET=tu-jwt-secret
NEXTAUTH_URL=https://happyhub.com
NEXTAUTH_SECRET=tu-nextauth-secret

# Email (futuro: SES)
# SES_REGION=eu-west-1
# SES_FROM_EMAIL=noreply@happyhub.com
```

#### 4.2. Actualizar Código de Base de Datos

Crear `src/lib/db.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

Reemplazar llamadas a Airtable con queries PostgreSQL:

```typescript
// Antes (Airtable)
const response = await airtable('Reservations').select().all();

// Después (PostgreSQL)
import pool from '@/lib/db';
const { rows } = await pool.query('SELECT * FROM reservations');
```

#### 4.3. Configurar DNS (Route 53)

```bash
# Crear hosted zone
aws --profile happyhub-cli route53 create-hosted-zone \
  --name happyhub.com \
  --caller-reference $(date +%s)

# Obtener name servers y configurar en tu registrador de dominios
aws --profile happyhub-cli route53 list-hosted-zones

# Crear registros DNS apuntando a Amplify o CloudFront
# (Esto se puede hacer desde la consola AWS más fácilmente)
```

---

### ✅ Fase 5: Testing y Migración (2-3 días)

#### 5.1. Testing en Staging

```bash
# Crear entorno de staging en Amplify
amplify add environment staging
amplify push

# O para EC2, crear instancia staging
aws --profile happyhub-cli ec2 run-instances \
  --image-id ami-0c38b837cd80f13bb \
  --instance-type t3.micro \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=happyhub-staging}]'
```

**Tests a realizar**:

1. ✅ Crear nueva reserva
2. ✅ Verificar workflow n8n se ejecuta
3. ✅ Confirmar inserción en PostgreSQL
4. ✅ Verificar email de confirmación
5. ✅ Probar pago con Stripe
6. ✅ Verificar webhook de Stripe
7. ✅ Subir imagen a S3
8. ✅ Verificar entrega desde CloudFront
9. ✅ Login/Logout
10. ✅ Dashboard admin

#### 5.2. Migración Final (Downtime mínimo)

**Plan de migración (Viernes noche recomendado)**:

```bash
# Hora 0:00 - Poner Vercel en modo mantenimiento
# Editar src/pages/_app.tsx para mostrar mensaje mantenimiento

# Hora 0:05 - Exportar últimos datos de Airtable
# Ejecutar script de migración final

# Hora 0:15 - Actualizar DNS
# Cambiar registros A/CNAME de Vercel a Amplify/CloudFront

# Hora 0:20 - Verificar propagación DNS
dig happyhub.com
nslookup happyhub.com

# Hora 0:30 - Testing en producción
# Ejecutar suite de tests

# Hora 1:00 - Go live!
# Quitar mensaje de mantenimiento
# Monitorear logs

# Hora 2:00 - Verificación final
# Revisar CloudWatch metrics
# Revisar Aurora connections
# Revisar logs de errores
```

#### 5.3. Rollback Plan

Si algo falla:

```bash
# 1. Revertir DNS a Vercel (TTL bajo: 300s = 5 min)
# 2. Mantener Airtable como source of truth
# 3. Analizar logs de error
# 4. Corregir y retry la siguiente semana
```

---

## 📊 Comparación de Costes

| Servicio | Antes (Vercel+Airtable) | Después (AWS) |
|----------|-------------------------|---------------|
| Frontend/Backend | Vercel Pro: 20€/mes | Amplify: 12€/mes |
| Base de datos | Airtable Pro: 20€/mes | Aurora Serverless: 25€/mes |
| Automatización | n8n (ya en EC2): 8€/mes | n8n (ya en EC2): 8€/mes |
| Storage | Incluido en Vercel | S3: 2€/mes |
| CDN | Incluido en Vercel | CloudFront: 3€/mes |
| **TOTAL** | **~48€/mes** | **~50€/mes** |

**Ventajas AWS**:
- ✅ Más control
- ✅ Escalabilidad automática
- ✅ Integración con servicios AWS (Bedrock, SES, etc.)
- ✅ Costes predecibles
- ✅ Backups automáticos (Aurora)
- ✅ Sin límites de API calls

---

## 🎯 Timeline Recomendado

**Opción Conservadora (3 semanas)**:
- Semana 1: Fase 0-1 (Preparación + Database)
- Semana 2: Fase 2-3 (Frontend + Storage)
- Semana 3: Fase 4-5 (Config + Testing + Go Live)

**Opción Agresiva (1 semana)**:
- Días 1-2: Fase 0-1
- Días 3-4: Fase 2-3
- Días 5-7: Fase 4-5

---

## 📝 Checklist Pre-Migración

Antes de empezar:

- [ ] Backup completo de Airtable (CSV)
- [ ] Backup completo de código (Git push)
- [ ] Documentar todas las variables de entorno
- [ ] Exportar workflows n8n
- [ ] Notificar a usuarios de posible downtime
- [ ] Configurar alertas de monitoreo
- [ ] Preparar plan de rollback
- [ ] Testing en staging environment
- [ ] Verificar costes estimados en AWS Cost Calculator
- [ ] Configurar billing alerts (50€, 75€, 90€)

---

## 🆘 Soporte y Referencias

**Documentación AWS**:
- [Amplify Next.js Guide](https://docs.amplify.aws/guides/hosting/nextjs/q/platform/js/)
- [Aurora Serverless v2](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)

**Comandos útiles durante migración**:

```bash
# Ver logs de Amplify en tiempo real
amplify console

# Monitorear Aurora
aws --profile happyhub-cli rds describe-db-clusters \
  --db-cluster-identifier happyhub-db-cluster

# Ver métricas CloudWatch
aws --profile happyhub-cli cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=happyhub-db-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## ✨ Próximos Pasos (Post-Migración)

Una vez completada la migración:

1. **Optimización de costes**:
   - Evaluar Reserved Instances para EC2
   - Configurar S3 Lifecycle policies
   - Implementar caching agresivo en CloudFront

2. **Seguridad**:
   - Configurar WAF en CloudFront
   - Habilitar AWS Shield
   - Rotar credenciales regularmente

3. **Nuevas features AWS**:
   - Habilitar Bedrock para AI assistant
   - Implementar SES para emails
   - Añadir Rekognition para análisis de fotos
   - Lambda functions para procesamiento async

4. **Monitoreo avanzado**:
   - Configurar AWS X-Ray para tracing
   - Implementar dashboards CloudWatch custom
   - Alertas SNS para errores críticos

---

¿Quieres que empiece con alguna fase específica? ¿Prefieres Amplify o EC2 para el frontend?
