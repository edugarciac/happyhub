# n8n - Pasos Rápidos para Fase 2

**n8n UI abierto**: http://34.243.177.162:5678

**Schema copiado** ✅: Listo para pegar

---

## 📝 Pasos (15 minutos)

### 1. Añadir Credencial PostgreSQL (5 min)

En n8n UI:

```
Perfil (arriba derecha) → Settings → Credentials → Add Credential
```

Buscar: **"Postgres"**

Completar:
```
Name: HappyHub Aurora
Host: happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com
Port: 5432
Database: happyhub
User: dbadmin
Password: c0MAkvDuZ6yWhfUUzgMh
SSL: Disable
```

Click **"Test"** → Debería decir "Success" ✅

Click **"Save"**

---

### 2. Crear Workflow "Setup Database" (5 min)

1. **New Workflow** → Nombre: "Setup Database"

2. **Añadir nodo**: Manual Trigger

3. **Añadir nodo**: PostgreSQL
   - Credential: HappyHub Aurora
   - Operation: Execute Query
   - Query: **Pega** (Cmd+V) - el schema ya está en tu clipboard
   - Click fuera del campo de texto para guardar

4. **Test**: Click "Execute node"

Si ves errores de sintaxis en el query, usa la versión más simple (solo CREATE TABLE sin funciones):

```sql
CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE, password_hash VARCHAR(255), name VARCHAR(255), role VARCHAR(50) DEFAULT 'client', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE event_types (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE, description TEXT, icon VARCHAR(50));

CREATE TABLE reservations (id SERIAL PRIMARY KEY, user_id INTEGER, event_date DATE, time_slot VARCHAR(50), event_type VARCHAR(100), guests INTEGER, total_price DECIMAL(10,2), status VARCHAR(50) DEFAULT 'pending', stripe_payment_intent_id VARCHAR(255), google_calendar_event_id VARCHAR(255), notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE providers (id SERIAL PRIMARY KEY, name VARCHAR(255), service_type VARCHAR(100), email VARCHAR(255), description TEXT, active BOOLEAN DEFAULT TRUE);

CREATE TABLE services (id SERIAL PRIMARY KEY, reservation_id INTEGER, provider_id INTEGER, service_name VARCHAR(255), price DECIMAL(10,2), status VARCHAR(50) DEFAULT 'requested');
```

---

### 3. Aplicar Seed Data (5 min)

Copio seed data al clipboard:

```bash
# Ejecuta en terminal:
cat migration/seed-data.sql | pbcopy
```

En n8n:
1. **Añadir nodo PostgreSQL** (conectado al anterior)
2. Operation: Execute Query
3. Query: **Pega** seed-data.sql
4. Execute

---

### 4. Verificar (2 min)

Añadir nodo PostgreSQL final:

Query:
```sql
SELECT 'users' as tabla, COUNT(*)::text as total FROM users
UNION ALL
SELECT 'event_types', COUNT(*)::text FROM event_types
UNION ALL
SELECT 'providers', COUNT(*)::text FROM providers;
```

Execute → Deberías ver:
```
users: 5
event_types: 11
providers: 14
```

---

## ✅ Cuando Termines

Avísame "listo fase 2" y continuamos con **Fase 3: Actualizar Next.js** para usar PostgreSQL.

---

## 🆘 Si n8n No Carga

```bash
# Verificar estado EC2
aws --profile happyhub-cli ec2 describe-instances \
  --instance-ids i-00e6ad6229322f4f3 \
  --region eu-west-1 \
  --query 'Reservations[0].Instances[0].State.Name'

# Debería decir: running
# Si dice stopped: arranca la instancia
```

---

**Ahora ve a n8n (ya abierto en tu navegador) y sigue los pasos** 👆

¿Se abrió n8n correctamente? ¿Ves la UI?
