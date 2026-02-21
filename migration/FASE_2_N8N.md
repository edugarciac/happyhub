# Fase 2: Configurar n8n Workflows - Guía Paso a Paso

**Objetivo**: Reemplazar nodos Airtable por PostgreSQL en workflows n8n.

**Duración estimada**: 1-2 horas

**Pre-requisito**: Aurora PostgreSQL desplegado (✅ completado en Fase 1)

---

## 🎯 Resultado Final

Al terminar esta fase tendrás:
- ✅ n8n conectado a Aurora PostgreSQL
- ✅ Workflow de reservas usando PostgreSQL en vez de Airtable
- ✅ Schema aplicado automáticamente desde n8n
- ✅ Workflow probado con reserva de prueba

---

## 📋 Información de Conexión Aurora

```
Host: happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com
Port: 5432
Database: happyhub
User: dbadmin
Password: c0MAkvDuZ6yWhfUUzgMh
SSL: No (conexión interna VPC)
```

---

## 🌐 Paso 1: Acceder a n8n UI

### 1.1. Verificar que n8n está corriendo

```bash
# Verificar estado de EC2
aws --profile happyhub-cli ec2 describe-instances \
  --instance-ids i-00e6ad6229322f4f3 \
  --region eu-west-1 \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text
```

Debería decir: `running`

### 1.2. Abrir n8n en el navegador

```bash
# Abrir n8n UI
open http://34.243.177.162:5678
```

O visita manualmente: **http://34.243.177.162:5678**

**Si no carga**:
- Verificar que EC2 esté running
- Verificar que el puerto 5678 esté abierto en security group
- Puede que necesites iniciar n8n manualmente en EC2

---

## 🔐 Paso 2: Añadir Credenciales PostgreSQL en n8n

### 2.1. En n8n UI

1. Click en tu perfil (esquina superior derecha)
2. Ir a **"Settings"** → **"Credentials"**
3. Click **"Add Credential"**
4. Buscar **"Postgres"** o **"PostgreSQL"**
5. Click para crear nueva credencial

### 2.2. Configurar Credencial PostgreSQL

Completa el formulario:

```
Credential Name: HappyHub Aurora PostgreSQL
Host: happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com
Port: 5432
Database: happyhub
User: dbadmin
Password: c0MAkvDuZ6yWhfUUzgMh
SSL: Disable (o "prefer")
```

### 2.3. Test Connection

Click en **"Test"** o **"Test Connection"**

Debería decir: **"Connection successful!"** ✅

Si falla:
- Verifica que EC2 n8n esté en la misma VPC que Aurora
- Verifica security group permite puerto 5432 desde VPC interna

---

## 🔧 Paso 3: Crear Workflow de Inicialización (Aplicar Schema)

Vamos a crear un workflow one-time que aplique el schema SQL.

### 3.1. Crear Nuevo Workflow

1. En n8n, click **"+ Add workflow"**
2. Nombre: **"Setup Database - One Time"**

### 3.2. Añadir Nodos

**Nodo 1: Manual Trigger**
- Buscar: "Manual Trigger"
- Arrastar al canvas

**Nodo 2: PostgreSQL - Create Tables**
- Buscar: "PostgreSQL"
- Arrastar al canvas
- Conectar desde Manual Trigger
- Configuración:
  - Credential: HappyHub Aurora PostgreSQL
  - Operation: **Execute Query**
  - Query: (copiar de migration/schema-simple.sql)

**Nodo 3: PostgreSQL - Insert Seed Data**
- Añadir otro nodo PostgreSQL
- Conectar desde nodo anterior
- Configuración:
  - Credential: HappyHub Aurora PostgreSQL
  - Operation: **Execute Query**
  - Query: (copiar de migration/seed-data.sql)

**Nodo 4: PostgreSQL - Verify**
- Añadir otro nodo PostgreSQL
- Conectar desde nodo anterior
- Configuración:
  - Credential: HappyHub Aurora PostgreSQL
  - Operation: **Execute Query**
  - Query:
```sql
SELECT 'users' as tabla, COUNT(*)::text as total FROM users
UNION ALL
SELECT 'event_types', COUNT(*)::text FROM event_types
UNION ALL
SELECT 'providers', COUNT(*)::text FROM providers;
```

### 3.3. Guardar y Ejecutar

1. Click **"Save"** (arriba)
2. Click **"Execute Workflow"** (botón play)
3. Ver resultados en cada nodo

Si todo sale bien:
- ✅ Nodo 1: Triggered
- ✅ Nodo 2: Tables created
- ✅ Nodo 3: Data inserted
- ✅ Nodo 4: Verification successful

---

## 📝 Paso 4: Actualizar Workflow de Reservas Principal

Ahora vamos a actualizar tu workflow principal que maneja reservas.

### 4.1. Abrir Workflow Existente

- Buscar workflow: **"happyhub-airtable-complete"** o similar
- O crear uno nuevo: **"HappyHub Reservations - PostgreSQL"**

### 4.2. Estructura del Workflow

```
Webhook Trigger
    ↓
Validate Input
    ↓
Check Availability (Google Calendar)
    ↓
[SI DISPONIBLE]
    ↓
Insert Reservation (PostgreSQL) ← NUEVO
    ↓
Create Calendar Event (Google)
    ↓
Update Reservation with Calendar ID (PostgreSQL) ← NUEVO
    ↓
Generate Payment Link (Stripe)
    ↓
Update Reservation with Stripe ID (PostgreSQL) ← NUEVO
    ↓
Send Email (Gmail/SMTP)
    ↓
Return Response
```

### 4.3. Nodo: Insert Reservation (PostgreSQL)

**Configuración**:
- Node: PostgreSQL
- Operation: Insert
- Table: reservations
- Columns:
  - `user_id`: NULL (por ahora, crear usuario después)
  - `event_date`: `{{$json.fecha}}`
  - `time_slot`: `{{$json.hora}}`
  - `event_type`: `{{$json.tipoEvento}}`
  - `guests`: `{{$json.pax}}`
  - `total_price`: `{{$json.precio}}`
  - `status`: 'pending'
  - `notes`: `{{$json.notas}}`

**Alternativa con SQL raw**:
```sql
INSERT INTO reservations (event_date, time_slot, event_type, guests, total_price, status, notes, created_at)
VALUES (
  '{{$json.fecha}}',
  '{{$json.hora}}',
  '{{$json.tipoEvento}}',
  {{$json.pax}},
  {{$json.precio}},
  'pending',
  '{{$json.notas}}',
  NOW()
)
RETURNING id, created_at;
```

### 4.4. Nodo: Update Reservation with Calendar ID

Después de crear evento en Google Calendar:

```sql
UPDATE reservations
SET google_calendar_event_id = '{{$json.calendar_event_id}}'
WHERE id = {{$json.reservation_id}};
```

### 4.5. Nodo: Update with Stripe Payment ID

Después de crear payment link:

```sql
UPDATE reservations
SET stripe_payment_intent_id = '{{$json.stripe_payment_id}}'
WHERE id = {{$json.reservation_id}};
```

---

## 📧 Paso 5: Actualizar Workflow de Confirmación de Pago

Cuando Stripe notifica pago exitoso:

```sql
UPDATE reservations
SET
  status = 'confirmed',
  deposit_paid = true,
  deposit_amount = total_price * 0.30,
  updated_at = NOW()
WHERE stripe_payment_intent_id = '{{$json.payment_intent_id}}';
```

---

## 🧪 Paso 6: Testing del Workflow

### 6.1. Preparar Datos de Prueba

Crear archivo `test-reservation.json`:

```json
{
  "nombre": "Test Usuario",
  "email": "test@example.com",
  "telefono": "+34666999999",
  "fecha": "2025-03-20",
  "hora": "afternoon",
  "pax": 20,
  "tipoEvento": "Cumpleaños",
  "precio": 145.00,
  "notas": "Reserva de prueba desde n8n"
}
```

### 6.2. Ejecutar Test

En n8n:
1. Click en nodo Webhook
2. Click **"Listen for test event"**
3. En terminal, enviar test:

```bash
# Desde tu Mac
curl -X POST http://34.243.177.162:5678/webhook/reservation-request \
  -H "Content-Type: application/json" \
  -d @test-reservation.json
```

### 6.3. Verificar en PostgreSQL

Después del test, verifica que se guardó:

```bash
# Ejecutar desde cualquier nodo PostgreSQL en n8n:
SELECT * FROM reservations ORDER BY created_at DESC LIMIT 1;
```

Deberías ver la reserva de prueba.

---

## 📊 Paso 7: Migrar Queries Existentes

Si tienes queries de Airtable en workflows, aquí está la equivalencia:

### Airtable → PostgreSQL Mapping

| Airtable | PostgreSQL |
|----------|------------|
| `base.select()` | `SELECT * FROM table` |
| `base.create()` | `INSERT INTO table VALUES (...)` |
| `base.update()` | `UPDATE table SET ... WHERE id = ...` |
| `base.delete()` | `DELETE FROM table WHERE id = ...` |
| `base.find()` | `SELECT * FROM table WHERE condition` |

### Ejemplos Comunes

**Get all reservations**:
```sql
SELECT * FROM reservations
WHERE status IN ('pending', 'confirmed')
ORDER BY event_date ASC;
```

**Get reservation by Google Calendar ID**:
```sql
SELECT * FROM reservations
WHERE google_calendar_event_id = '{{$json.calendar_id}}'
LIMIT 1;
```

**Count reservations for a date**:
```sql
SELECT COUNT(*) as total
FROM reservations
WHERE event_date = '{{$json.fecha}}'
  AND time_slot = '{{$json.hora}}'
  AND status IN ('pending', 'confirmed');
```

**Get active providers by service type**:
```sql
SELECT * FROM providers
WHERE service_type = '{{$json.service}}'
  AND active = true
ORDER BY name;
```

---

## ✅ Paso 8: Checklist Fase 2

Verifica que completaste:

- [ ] n8n UI accesible (http://34.243.177.162:5678)
- [ ] Credenciales PostgreSQL creadas en n8n
- [ ] Test de conexión exitoso
- [ ] Workflow "Setup Database" creado y ejecutado
- [ ] Schema SQL aplicado (5 tablas creadas)
- [ ] Seed data aplicado (users, event_types, providers)
- [ ] Workflow principal de reservas actualizado
- [ ] Nodos Airtable reemplazados por PostgreSQL
- [ ] Test de reserva exitoso
- [ ] Datos guardados en PostgreSQL verificados

---

## 🐛 Troubleshooting

### n8n no carga (puerto 5678)
```bash
# SSH a EC2 n8n
ssh -i ~/.ssh/n8n-keypair.pem ubuntu@34.243.177.162

# Verificar que n8n está corriendo
sudo systemctl status n8n
# O:
pm2 status

# Reiniciar si es necesario
pm2 restart n8n
```

### Error de conexión PostgreSQL desde n8n
- **Causa**: Security group o credenciales incorrectas
- **Solución**: Verifica que sg-006dd0152ea5377bf permite puerto 5432 desde VPC interna (172.31.0.0/16)

### Schema ya existe (error "table already exists")
- **Causa**: Ya aplicaste el schema antes
- **Solución**: Puedes saltarte el workflow de setup y continuar con el workflow de reservas

---

## 📄 Archivos SQL Para Copiar en n8n

Los archivos están en S3, accesibles desde EC2:
- `s3://happyhub-assets-prod/migration/schema-simple.sql`
- `s3://happyhub-assets-prod/migration/seed-data.sql`

O copia contenido desde local:
```bash
# Ver schema
cat migration/schema-simple.sql

# Ver seed data
cat migration/seed-data.sql
```

---

## ➡️ Próximo Paso

Una vez completada Fase 2:

```bash
# Marcar como completada
echo "✅ Fase 2 completada: $(date)" >> migration/progress.log

# Continuar con Fase 3
cat migration/FASE_3_NEXTJS.md
```

O ejecutar checklist:
```bash
./scripts/migration-checklist.sh
```

---

## 💡 Nota Importante

**Schema se aplicará desde n8n**: Como n8n tiene acceso a la VPC, cuando ejecutes el workflow de setup, el schema se aplicará automáticamente. Esto resuelve el problema de conectividad que tuvimos en Fase 1.

¡Vamos! Abre n8n y empecemos 🚀
