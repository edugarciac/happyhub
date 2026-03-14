# OpenSpec: HappyHub reservation system

Version: 1.2
Date: 2026-03-13
Status: Draft - pending review

---

## 1. Overview

Complete reservation system for HappyHub, an event space rental business in Esplugues de Llobregat, Barcelona. Covers the full flow from the frontend booking page through the n8n backend workflow.

**Frontend**: Next.js booking wizard (4 steps) with calendar, configuration, customer data, and confirmation
**Backend**: n8n workflow triggered by POST webhook
**Result**: Reservation saved in DB, Google Calendar event created with full details, WhatsApp notifications sent to customer and admin, confirmation email sent to customer

---

## PART A: FRONTEND (booking page)

---

## A1. Booking wizard (4 steps)

The booking page (`/reservas`) is a 4-step wizard. The user must complete each step before advancing to the next. A progress bar at the top shows the current step.

### Step 1: Calendar and time slot selection

**Page**: calendar view showing current and next month
**Data source**: `/api/booked-slots` (DB query) + `/api/pricing/current`

Behavior:
- Each day shows up to 3 time slots: morning, afternoon, night
- Each slot shows its price (from pricing API)
- Slots that are already reserved (status pending, approved, or confirmed in DB) must be visually marked as **occupied** and **not selectable**
- Past dates are not selectable
- The user selects exactly one date + one slot to continue

Visual states for each slot:

| State | Color | Clickable | Label |
|-------|-------|-----------|-------|
| Available | Cyan (#00BCD4) | Yes | Price (e.g. "185 EUR") |
| Selected (current selection) | Dark cyan (#007a8c) | Yes | Price + checkmark |
| Occupied | Red (#FF6B35) | No | "Reservado" |
| Past date | Gray | No | "-" |
| Night slot | Orange (consult) | Yes | "Consultar" |

**Loading state**: While fetching booked slots and pricing, show a centered spinner with text "Cargando disponibilidad..."

**Error state** (NEW - currently missing):
- If `/api/booked-slots` fails: show inline alert "No se ha podido cargar la disponibilidad. Intentalo de nuevo." with a retry button
- If `/api/pricing/current` fails: show inline alert "No se han podido cargar los precios. Intentalo de nuevo." with a retry button
- Do NOT show the calendar with potentially stale data on error

**API: /api/booked-slots**
```
GET /api/booked-slots
Response 200:
{
  "slots": [
    { "date": "2026-04-15", "timeSlot": "afternoon" },
    { "date": "2026-04-16", "timeSlot": "morning" }
  ]
}
```

DB query:
```sql
SELECT TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, time_slot
FROM reservations
WHERE status IN ('pending', 'approved', 'confirmed')
AND event_date >= CURRENT_DATE
```

### Step 2: Configuration

**Fields:**
- Number of guests: 1-150 (required, default 20)
- Extras (optional, multiple selection):

| Extra | Price type | Price |
|-------|-----------|-------|
| catering | Per person | 15 EUR/person |
| animacion | Fixed | 150 EUR |
| decoracion | Fixed | 100 EUR |
| fotografia | Fixed | 200 EUR |
| tarta | Fixed | 50 EUR |

**Price calculation** (shown live as user changes values):
- Total = basePrice + (catering guests if selected) + sum of fixed extras
- Deposit = ceil(total * 0.30)

### Step 3: Customer data and submission

**Fields:**
- Name (required, min 2 chars)
- Email (required, valid email format)
- Phone (required, min 9 digits)
- Event type (required, select one):
  - cumpleanos, celebracion-familiar, eventos-amigos, eventos-colegio-trabajo, taller, otros
- Message (optional, free text)
- Payment method (required): card, bizum, cash
- Accept terms (required checkbox)

**Validation**: all required fields validated on submit before calling API. Show inline validation errors per field.

**Submission flow:**
1. User clicks "Confirmar reserva"
2. Button changes to loading state: spinner + "Enviando reserva..." (not clickable)
3. POST to `/api/webhook-reserva` with full payload
4. Handle response (see A2 below)

### Step 4: Confirmation

Shown only after successful submission. Displays:
- Reservation ID (from API response)
- Summary of all booking details
- Deposit amount and payment instructions
- "Te contactaremos en las proximas 24 horas"
- Contact email link

---

## A2. Error handling (frontend)

### Submission errors (Step 3)

When `/api/webhook-reserva` returns an error, the form must show a user-friendly message. The submit button returns to its normal state so the user can retry.

| HTTP code | User message | Detail |
|-----------|-------------|--------|
| 409 | "Esta fecha y franja horaria ya esta reservada. Por favor, vuelve al paso 1 y elige otra fecha." | Include a "Volver al calendario" button that takes user back to Step 1 |
| 503 | "El servicio de reservas no esta disponible en este momento. Intentalo de nuevo en unos minutos." | - |
| 500 | "Ha ocurrido un error al procesar tu reserva. Intentalo de nuevo." | - |
| Network error | "No se ha podido conectar con el servidor. Comprueba tu conexion a internet." | - |

**Error display format:**
```
[Red alert box]
  [Icon] User-friendly message
  [Small gray text, collapsed by default] "Ver detalles del error >"
    -> Expands to show: HTTP code + raw error message from API
  [If 409: "Volver al calendario" button]
  [Else: "Intentar de nuevo" button]
```

The "Ver detalles del error" toggle is for debugging purposes. It shows the technical details (HTTP status, error message from the API response) without overwhelming the user.

### API endpoint: /api/webhook-reserva

This endpoint must properly propagate n8n response codes to the frontend:

```
POST /api/webhook-reserva
Body: (full reservation payload, see section 2)

Success (200):
{
  "success": true,
  "reservationId": "RES-20260415-001",
  "message": "Reserva creada exitosamente"
}

Conflict (409) - must forward n8n's 409:
{
  "success": false,
  "error": "Esta fecha y franja horaria ya esta reservada."
}

Service unavailable (503):
{
  "success": false,
  "error": "No se puede conectar con el servicio de reservas."
}

Server error (500):
{
  "success": false,
  "error": "Error al procesar la reserva.",
  "detail": "(raw error message for debugging)"
}
```

**Critical fix needed**: Currently the endpoint catches n8n's 409 response and returns it as 500. It must forward the HTTP status code from n8n to the frontend so the frontend can show the correct "slot occupied" message.

### Calendar errors (Step 1)

| Scenario | User message | Action |
|----------|-------------|--------|
| /api/booked-slots fails | "No se ha podido cargar la disponibilidad." | Show retry button, hide calendar |
| /api/pricing/current fails | "No se han podido cargar los precios." | Show retry button, hide calendar |
| Both fail | "No se ha podido cargar la disponibilidad." | Show retry button, hide calendar |

Never show a calendar with empty/stale booked-slot data. If the fetch fails, the user could select an occupied slot without knowing it.

---

## A3. Booking state (context)

The booking wizard uses React Context to share state between steps. Current fields plus new error/loading fields:

```typescript
interface BookingState {
  // Navigation
  step: number;                         // 1-4

  // Step 1: Date & time
  date: Date | null;
  timeSlot: 'morning' | 'afternoon' | 'night' | null;

  // Step 2: Configuration
  guests: number;
  selectedExtras: string[];

  // Step 3: Customer data
  name: string;
  email: string;
  phone: string;
  eventType: string | null;
  message: string;
  acceptTerms: boolean;
  paymentMethod: 'card' | 'bizum' | 'cash' | null;

  // Pricing
  basePrice: number | 'consult';

  // Result
  reservationId: string | null;

  // Error & loading (NEW)
  isSubmitting: boolean;                // true while POST in flight
  submitError: string | null;           // user-friendly error message
  submitErrorDetail: string | null;     // technical detail (HTTP code + raw msg)
  calendarError: string | null;         // error loading calendar data
}
```

---

## A4. Pricing rules

### Base prices (2025)

| Day type | Morning | Afternoon | Night |
|----------|---------|-----------|-------|
| Weekday (Mon-Thu) | 110 EUR | 110 EUR | Consultar |
| Friday | 110 EUR | 155 EUR | Consultar |
| Holiday eve | 110 EUR | 155 EUR | Consultar |
| Weekend (Sat-Sun) | 145 EUR | 185 EUR | Consultar |
| Holiday | 145 EUR | 185 EUR | Consultar |

### Spanish holidays 2025
2025-01-01, 2025-01-06, 2025-04-18, 2025-05-01, 2025-08-15, 2025-10-12, 2025-11-01, 2025-12-06, 2025-12-08, 2025-12-25

### Deposit
30% of total price, rounded up: `Math.ceil(totalPrice * 0.30)`

---

## PART B: BACKEND (n8n workflow)

---

## B1. Incoming webhook payload

The frontend sends this exact JSON structure to the webhook:

```json
{
  "name": "Juan Garcia",
  "email": "juan@example.com",
  "phone": "+34612345678",
  "eventType": "cumpleanos",
  "date": "2026-04-15",
  "time": "16:30",
  "timeSlot": "afternoon",
  "guests": 25,
  "duration": "4",
  "extras": ["catering", "decoracion"],
  "paymentMethod": "bizum",
  "message": "Cumple de mi hijo, 8 anos",
  "totalPrice": 560,
  "depositAmount": 168,
  "basePrice": 185,
  "source": "web",
  "timestamp": "2026-04-01T10:30:00Z"
}
```

### Field details

| Field | Type | Required | Values |
|-------|------|----------|--------|
| name | string | yes | Min 2 chars |
| email | string | yes | Valid email |
| phone | string | yes | Min 9 digits |
| eventType | string | yes | cumpleanos, celebracion-familiar, eventos-amigos, eventos-colegio-trabajo, taller, otros |
| date | string | yes | YYYY-MM-DD |
| time | string | yes | HH:MM (11:00, 16:30, 22:00) |
| timeSlot | string | yes | morning, afternoon, night |
| guests | number | yes | 1-150 |
| duration | string | yes | Always "4" |
| extras | string[] | no | catering, animacion, decoracion, fotografia, tarta |
| paymentMethod | string | yes | card, bizum, cash |
| message | string | no | Free text |
| totalPrice | number | yes | In euros |
| depositAmount | number | yes | 30% of totalPrice |
| basePrice | number | yes | Space rental price |
| source | string | yes | Always "web" |
| timestamp | string | yes | ISO 8601 |

### Time slot mapping

| Slot | Start | End | Early opening (free) |
|------|-------|-----|----------------------|
| morning | 11:00 | 14:30 | 10:00 |
| afternoon | 16:30 | 20:30 | 15:30 |
| night | 22:00 | 02:00 (+1 day) | 21:30 |

---

## B2. Database schema (Neon PostgreSQL)

**Connection**: `ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech` / `neondb` / SSL required

### Table: reservations

```sql
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL,
  guests INT NOT NULL,
  extras JSONB DEFAULT '[]',
  base_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  payment_method VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  customer_message TEXT,
  google_calendar_event_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(event_date, time_slot)
);
```

### Status values
- `pending` - initial state after creation
- `approved` - admin approved
- `confirmed` - payment received
- `rejected` - admin rejected
- `cancelled` - customer cancelled

---

## B3. Workflow nodes (in order)

### Node 1: Webhook Reserva (entry point)

- Type: Webhook
- Method: POST
- Path: `reservation-request`
- Response mode: responseNode (response sent later by a dedicated node)

### Node 2: Normalizar Datos (code/function)

Normalize the incoming payload and calculate Calendar datetimes.

**Input**: raw webhook body
**Output**: normalized object with these fields:

```javascript
{
  nombre: body.name || body.nombre,
  email: body.email,
  telefono: body.phone || body.telefono,
  fecha: body.date || body.fecha,                    // "2026-04-15"
  hora: body.time || body.hora,                      // "16:30"
  timeSlot: body.timeSlot || 'afternoon',
  pax: body.guests || body.pax || 20,
  duracion: body.duration || '4',
  extras: JSON.stringify(body.extras || []),          // stringified for DB
  tipoEvento: body.eventType || body.tipoEvento || 'cumpleanos',
  mensaje: body.message || body.mensaje || '',
  precioBase: body.basePrice || 0,
  precioTotal: body.totalPrice || body.precioTotal || 0,
  depositoAmount: body.depositAmount || body.depositoAmount || 0,
  metodoPago: body.paymentMethod || 'cash',

  // Calculated: ISO datetimes for Google Calendar
  fechaHoraInicio: "2026-04-15T16:30:00.000Z",      // date + time
  fechaHoraFin: "2026-04-15T20:30:00.000Z",         // date + time + duration

  // Formatted for display in WhatsApp messages
  fechaFormateada: "15/04/2026",                     // DD/MM/YYYY
  horaFormateada: "16:30h"                           // HH:MMh
}
```

**DateTime calculation logic:**
```javascript
const [year, month, day] = fecha.split('-');
const [hours, minutes] = hora.split(':');
const startDateTime = new Date(year, month - 1, day, hours, minutes);
const durationHours = parseInt(duracion);
const endDateTime = new Date(startDateTime);
endDateTime.setHours(endDateTime.getHours() + durationHours);
```

### Node 3: Verificar Disponibilidad (Postgres)

Check if the date+slot is already booked. Uses `COUNT(*)` so it always returns exactly 1 row (never 0 rows, which would break the flow in n8n).

```sql
SELECT COUNT(*) as total
FROM reservations
WHERE event_date = '{{fecha}}'
AND time_slot = '{{timeSlot}}'
AND status IN ('pending', 'approved', 'confirmed')
```

**Credentials**: Neon HappyHub (PostgreSQL, SSL required)

### Node 4: Fecha Disponible? (If/else)

- Condition: `total` equals `0`
- True (available) -> Node 5 (Guardar en Neon DB)
- False (occupied) -> Node 4b (Respuesta: No Disponible)

### Node 4b: Respuesta: No Disponible (Webhook Response)

- HTTP 409
- Body:
```json
{
  "success": false,
  "error": "Lo siento, la fecha y hora ya esta reservada.",
  "message": "Lo siento, la fecha y hora indicada ya esta reservada."
}
```

### Node 5: Guardar en Neon DB (Postgres)

Insert the reservation. References data from "Normalizar Datos" node (not from $json, since the previous node was the If node).

```sql
INSERT INTO reservations (
  name, email, phone, event_type, event_date,
  time_slot, guests, extras, base_price,
  total_price, deposit_amount, payment_method,
  customer_message, status, created_at
) VALUES (
  '{{nombre}}', '{{email}}', '{{telefono}}', '{{tipoEvento}}', '{{fecha}}',
  '{{timeSlot}}', {{pax}}, '{{extras}}'::jsonb, {{precioBase}},
  {{precioTotal}}, {{depositoAmount}}, '{{metodoPago}}',
  '{{mensaje}}', 'pending', NOW()
) RETURNING id
```

**Credentials**: Neon HappyHub

### Node 6: Crear Evento Calendar (Google Calendar)

Create a Google Calendar event with ALL reservation details visible in the calendar entry.

- **Calendar**: `happyhub.rovellat@gmail.com` (or "primary" if authorized with that account)
- **Operation**: Create event
- **Start**: `fechaHoraInicio` from Normalizar Datos
- **End**: `fechaHoraFin` from Normalizar Datos
- **Summary (title)**: `HappyHub - {{nombre}} - {{tipoEvento}}`
- **Description (body)**:
```
Tipo de evento: {{tipoEvento}}
Nombre: {{nombre}}
Participantes: {{pax}} personas
Telefono: {{telefono}}
Email: {{email}}
Metodo de pago: {{metodoPago}}
Precio base: {{precioBase}} EUR
Precio total: {{precioTotal}} EUR
Senal (30%): {{depositoAmount}} EUR
Extras: {{extras}}
Mensaje del cliente: {{mensaje}}
```
- **Location**: `HappyHub - C/ Rovellat, 27, 08950 Esplugues de Llobregat`
- **Send updates**: all

**Credentials**: Google Calendar OAuth2 (authorized with happyhub.rovellat@gmail.com)

**Critical**: all expression fields must reference `$('Normalizar Datos').item.json.fieldName` since the direct input comes from the Postgres INSERT node (which only returns `id`).

### Node 7: Preparar Respuesta (Code/Function)

Generate the reservation ID and consolidate all data for notifications.

```javascript
const dbResult = $('Guardar en Neon DB').item.json;
const data = $('Normalizar Datos').item.json;
const calendarEvent = $('Crear Evento Calendar').item.json;

const reservationId = `RES-${data.fecha.replace(/-/g, '')}-${String(dbResult.id).padStart(3, '0')}`;

return [{
  json: {
    reservationId,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    fecha: data.fechaFormateada,
    hora: data.horaFormateada,
    pax: data.pax,
    tipoEvento: data.tipoEvento,
    extras: data.extras,
    metodoPago: data.metodoPago,
    total: data.precioTotal,
    deposito: data.depositoAmount,
    calendarEventId: calendarEvent.id || '',
    dbId: dbResult.id
  }
}];
```

### Node 8: WhatsApp Cliente (HTTP Request)

Send confirmation WhatsApp to the customer.

- Method: POST
- URL: `https://graph.facebook.com/v18.0/{{$env.WHATSAPP_PHONE_NUMBER_ID}}/messages`
- Headers:
  - Authorization: `Bearer {{$env.WHATSAPP_ACCESS_TOKEN}}`
  - Content-Type: `application/json`
- Body:
```json
{
  "messaging_product": "whatsapp",
  "to": "{{telefono}}",
  "type": "text",
  "text": {
    "body": "Hola {{nombre}}!\n\nTu reserva en HappyHub ha sido recibida correctamente.\n\nFecha: {{fecha}}\nHora: {{hora}}\nInvitados: {{pax}}\nTotal: {{total}} EUR\nSenal (30%): {{deposito}} EUR\nN. Reserva: {{reservationId}}\n\nNos pondremos en contacto contigo en las proximas 24 horas para confirmar todos los detalles y enviarte el enlace de pago.\n\nNecesitas ayuda? Responde a este mensaje.\n\nGracias por confiar en HappyHub"
  }
}
```

### Node 9: WhatsApp Admin (HTTP Request)

Notify admin about new reservation. Runs in parallel with Node 8.

- Same endpoint and auth as Node 8
- To: `{{$env.ADMIN_WHATSAPP_NUMBER}}`
- Body:
```
Nueva Reserva Recibida

Cliente: {{nombre}}
Email: {{email}}
Telefono: {{telefono}}
Fecha: {{fecha}} {{hora}}
Invitados: {{pax}}
Tipo: {{tipoEvento}}
Metodo pago: {{metodoPago}}
Total: {{total}} EUR
Senal: {{deposito}} EUR
ID: {{reservationId}}

Guardado en BD (ID: {{dbId}})
Calendario actualizado
```

### Node 10: Email Cliente (Send Email / SMTP)

Send a confirmation email with all booking details to the customer. Runs in parallel with WhatsApp nodes.

- **Type**: n8n-nodes-base.sendEmail (SMTP)
- **From**: `happyhub.rovellat@gmail.com`
- **To**: `{{ email }}` (from PrepararRespuesta)
- **Subject**: `Confirmacion de reserva {{ reservationId }} - HappyHub`
- **Format**: HTML email
- **continueOnFail**: true (email failure must not block the reservation)

**Email content (HTML)**:

The email includes a branded header (orange gradient with "HappyHub" title), followed by a table with all reservation details:

| Field | Value |
|-------|-------|
| N. Reserva | reservationId |
| Fecha | fecha |
| Hora | hora |
| Invitados | pax personas |
| Tipo de evento | tipoEvento |
| Extras | extras |
| Metodo de pago | metodoPago |
| Precio total | total EUR |
| Senal (30%) | deposito EUR |

Below the table, a callout box with next steps: "Nos pondremos en contacto contigo en las proximas 24 horas para confirmar todos los detalles y enviarte el enlace de pago de la senal."

Footer with contact info (phone 624 645 517, email happyhub.rovellat@gmail.com) and address.

**Credentials**: SMTP HappyHub Gmail (Gmail App Password, see B5)

### Node 11: Respuesta: Exito (Webhook Response)

Final response back to the frontend.

- HTTP 200
- Body:
```json
{
  "success": true,
  "reservationId": "{{reservationId}}",
  "message": "Reserva creada exitosamente"
}
```

---

## B4. Node connections (flow)

```
Webhook Reserva
  -> Normalizar Datos
    -> Verificar Disponibilidad (Neon)
      -> Fecha Disponible?
        -> TRUE:  Guardar en Neon DB
                    -> Crear Evento Calendar
                      -> Preparar Respuesta
                        -> WhatsApp Cliente (parallel)  -> Respuesta: Exito
                        -> WhatsApp Admin (parallel)
                        -> Email Cliente (parallel)
        -> FALSE: Respuesta: No Disponible (409)
```

---

## B5. n8n credentials required

| Name | Type | Details |
|------|------|---------|
| Neon HappyHub | PostgreSQL | Host: ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech, DB: neondb, SSL: require |
| Google Calendar HappyHub | Google Calendar OAuth2 | Authorized with happyhub.rovellat@gmail.com |
| SMTP HappyHub Gmail | SMTP | Host: smtp.gmail.com, Port: 465, SSL: true, User: happyhub.rovellat@gmail.com, Password: Gmail App Password |

## B6. n8n environment variables required

| Variable | Value | Used by |
|----------|-------|---------|
| WHATSAPP_PHONE_NUMBER_ID | (Meta Business phone ID) | WhatsApp nodes |
| WHATSAPP_ACCESS_TOKEN | (Meta Graph API token) | WhatsApp nodes |
| ADMIN_WHATSAPP_NUMBER | +34624645517 | WhatsApp Admin node |

---

## B7. Error handling (backend)

| Scenario | Response | HTTP Code |
|----------|----------|-----------|
| Date/slot already booked | "La fecha y hora ya esta reservada" | 409 |
| DB connection error | n8n default error | 500 |
| Calendar creation fails | Workflow should continue (non-blocking) | 200 (with warning) |
| WhatsApp send fails | Workflow should continue (non-blocking) | 200 |
| Email send fails | Workflow should continue (non-blocking) | 200 |

---

## B8. Important n8n implementation notes

1. **Expression prefix**: All fields containing `{{ }}` expressions MUST have the `=` prefix in the JSON, or be toggled to "Expression" mode in the UI. Without this, n8n treats them as literal text.

2. **Referencing non-adjacent nodes**: When a node needs data from a node that is NOT its direct predecessor (e.g., Calendar node needs data from Normalizar Datos, but its input comes from Guardar en Neon DB), use `$('Normalizar Datos').item.json.fieldName` syntax. Do NOT use `$json.fieldName` in those cases.

3. **Empty result handling**: Never use `SELECT ... WHERE` queries that might return 0 rows, because n8n stops the flow when a node outputs 0 items. Always use `COUNT(*)` or similar to guarantee at least 1 output row.

4. **Google Calendar node**: In the n8n Google Calendar node (v1), `description` and `location` go inside "Additional Fields" (additionalFields). The `summary` (event title) can be a direct parameter.

5. **Parallel execution**: WhatsApp Cliente and WhatsApp Admin should both connect from the output of Preparar Respuesta, so they run in parallel. Only one of them needs to connect to Respuesta: Exito.

6. **SQL injection**: The current approach uses string interpolation in SQL queries, which is a known risk. For production, consider using parameterized queries if the n8n Postgres node version supports them.
