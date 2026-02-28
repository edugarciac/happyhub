# Fix: n8n Workflow se Detiene en Nodo SQL

## 🐛 Problema

El workflow se para después de un nodo SQL con mensaje "No output data" o similar.

## ✅ Solución Rápida (30 segundos)

### En n8n.happyhub.es:

1. **Click en el nodo SQL** que falla
2. **Tab "Settings"** (engranaje)
3. **Scroll down** → Busca **"Continue On Fail"**
4. **Activa:** ✓ Continue On Fail
5. **O busca:** "Always Output Data"
6. **Activa:** ✓ Always Output Data
7. **Save** (arriba)
8. **Execute Workflow** (play ▶️)

---

## 🔧 Para el Workflow de Reservas Específicamente

**El problema:** SQL busca reserva que aún no existe.

**Solución:** El flujo debe ser:

```
Webhook → Set Default Data → Postgres Insert → Email → WhatsApp → Response
```

**NO debe ser:**
```
Webhook → Postgres SELECT (falla si no existe) ❌
```

### Fix en el Workflow:

1. **Después del Webhook**, añade nodo **Set**:
   ```
   Name: Prepare Reservation Data

   Fields:
   - reservation_id: {{ $now | timestamp }}
   - customer_name: {{ $json.name }}
   - customer_email: {{ $json.email }}
   - customer_phone: {{ $json.phone }}
   - event_date: {{ $json.date }}
   - time_slot: {{ $json.time }}
   - guests: {{ $json.guests }}
   - total_price: {{ $json.totalPrice }}
   - status: pending
   ```

2. **Después de Set**, añade **Postgres INSERT**:
   ```sql
   INSERT INTO reservations (
     user_id, event_date, time_slot, event_type,
     guests, total_price, status, notes
   )
   VALUES (
     NULL, -- user_id null para reservas web sin login
     '{{ $json.event_date }}',
     '{{ $json.time_slot }}',
     '{{ $json.eventType }}',
     {{ $json.guests }},
     {{ $json.total_price }},
     'pending',
     'Reserva web'
   )
   RETURNING id, event_date, time_slot, status;
   ```

3. **Set "Return Mode":** Return All
4. **Conecta:** Insert → Email (usar $json de INSERT para reservation_id)

---

## 🎯 O Usa el Workflow Simple Sin SQL

**Workflow mínimo que SÍ funciona:**

```
1. Webhook (recibe datos)
2. Set (mapea datos)
3. HTTP Request (envía email vía API o SMTP directo)
4. HTTP Request (envía WhatsApp)
5. Respond to Webhook
```

**Sin consultas SQL** - las reservas se guardan desde la app, n8n solo notifica.

---

## 📄 Workflow Correcto para Importar

El workflow `reservation-approval-flow.json` que creamos NO tiene SQL, solo:
- Webhook → Email → WhatsApp → Response

**Es más simple y no falla.**

---

## ✅ Acción Inmediata

**En n8n.happyhub.es:**

1. **Desactiva el workflow actual** (toggle OFF)
2. **Crea nuevo workflow:**
   - Import: `n8n/workflows/reservation-approval-flow.json`
   - O copia los nodos del workflow simple que te mostré
3. **Activa el nuevo** (toggle ON)
4. **Test reserva de nuevo**

---

## 🧪 Test que el Webhook Funciona

```bash
curl -X POST https://n8n.happyhub.es/webhook/reservation-request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "customer_name": "Test",
    "customer_email": "test@test.com",
    "customer_phone": "612345678",
    "event_date": "2026-03-15",
    "time_slot": "afternoon",
    "eventType": "cumpleaños",
    "guests": 30,
    "total_price": 185,
    "reservation_id": 999
  }'
```

**Debe responder sin error 500.**

---

**¿Qué workflow estás usando en n8n? ¿Es el que importaste o uno que ya existía?**