# Flujo de Reservas con WhatsApp Business

**Fecha:** 2026-02-22
**Estado:** Implementado en frontend, pendiente workflow n8n

## Cambios Realizados en Frontend

### Flujo Anterior
```
Usuario → Formulario → /api/create-checkout-session → Stripe Checkout → Pago → Stripe Webhook → n8n
```

### Flujo Nuevo
```
Usuario → Formulario → /api/webhook-reserva → n8n → [WhatsApp, BD, Email, Calendar, Stripe]
                                                         ↓
                                                   Confirmación
```

## Formato de Datos Enviados a n8n

### Endpoint
```
POST /webhook/reservation-request
Content-Type: application/json
```

### Payload (Request Body)
```json
{
  // Datos del cliente
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+34638390600",
  "eventType": "cumpleaños",
  "message": "Queremos decoración especial de superhéroes",

  // Datos de la reserva
  "date": "2026-03-15",
  "time": "16:30",
  "timeSlot": "afternoon",
  "guests": 30,
  "duration": "4",
  "extras": ["catering", "decoracion", "animacion"],

  // Precios
  "basePrice": 185,
  "totalPrice": 1135,
  "depositAmount": 341,

  // Metadata
  "source": "web",
  "timestamp": "2026-02-22T19:30:00.000Z"
}
```

### Campos Explicados

**Datos del Cliente:**
- `name`: Nombre completo
- `email`: Email de contacto
- `phone`: Teléfono con prefijo internacional (ej: +34...)
- `eventType`: Tipo de evento (valores posibles: 'cumpleaños', 'celebracion-familiar', 'eventos-amigos', 'eventos-colegio-trabajo', 'taller', 'otros')
- `message`: Mensaje opcional del cliente

**Datos de Reserva:**
- `date`: Fecha en formato YYYY-MM-DD
- `time`: Hora en formato HH:MM (11:00, 16:30, o 22:00)
- `timeSlot`: Franja horaria ('morning', 'afternoon', 'night')
- `guests`: Número de invitados
- `duration`: Duración en horas (string, por defecto "4")
- `extras`: Array de IDs de servicios extras seleccionados
  - Valores posibles: 'catering', 'animacion', 'decoracion', 'fotografia', 'tarta'

**Precios (en euros):**
- `basePrice`: Precio base del alquiler del espacio
- `totalPrice`: Precio total (base + extras)
- `depositAmount`: Señal del 30% (redondeado hacia arriba)

**Metadata:**
- `source`: Origen de la solicitud (siempre "web")
- `timestamp`: Fecha/hora de la solicitud en ISO 8601

## Formato de Respuesta Esperada de n8n

### Respuesta Exitosa
```json
{
  "success": true,
  "reservationId": "RES-20260222-001",
  "message": "Reserva creada exitosamente"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": "Fecha no disponible. Ya existe una reserva para ese horario."
}
```

## Workflow n8n Recomendado

### Nodos del Workflow

```
1. Webhook Trigger (reservation-request)
   ↓
2. Validar Disponibilidad (Google Calendar)
   ↓
3. [SI DISPONIBLE]
   ├─> Guardar en Base de Datos (Neon PostgreSQL)
   ├─> Crear Evento en Google Calendar
   ├─> Generar ID de Reserva
   ├─> Enviar WhatsApp Business (Cliente)
   ├─> Enviar WhatsApp Business (Admin)
   ├─> Enviar Email Confirmación (Cliente)
   ├─> [OPCIONAL] Crear Stripe Payment Link
   └─> Responder al Webhook (success)

4. [SI NO DISPONIBLE]
   └─> Responder al Webhook (error)
```

## Integración con WhatsApp Business

### API de WhatsApp Business (Meta)
```
Endpoint: https://graph.facebook.com/v18.0/{phone-number-id}/messages
Method: POST
Headers:
  Authorization: Bearer {access-token}
  Content-Type: application/json
```

### Ejemplo de Mensaje al Cliente
```json
{
  "messaging_product": "whatsapp",
  "to": "+34638390600",
  "type": "template",
  "template": {
    "name": "reserva_confirmada",
    "language": {
      "code": "es"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Juan Pérez" },
          { "type": "text", "text": "15/03/2026" },
          { "type": "text", "text": "16:30h" },
          { "type": "text", "text": "1135€" },
          { "type": "text", "text": "341€" },
          { "type": "text", "text": "RES-20260222-001" }
        ]
      }
    ]
  }
}
```

### Template de WhatsApp (crear en Meta Business)

**Nombre:** `reserva_confirmada`
**Idioma:** Español
**Categoría:** Utilidad

**Contenido:**
```
¡Hola {{1}}! 🎉

Tu reserva en HappyHub ha sido recibida correctamente.

📅 Fecha: {{2}}
🕐 Hora: {{3}}
💰 Total: {{4}}
💳 Señal: {{5}}
🔖 Nº Reserva: {{6}}

Te enviamos el enlace de pago para la señal del 30%:
[LINK_PAGO]

Nos pondremos en contacto contigo en las próximas 24 horas para confirmar todos los detalles.

¿Necesitas ayuda? Responde a este mensaje.

Gracias por confiar en HappyHub 💙
```

## Guardar en Base de Datos Neon

### Query SQL para Insertar Reserva
```sql
INSERT INTO reservations (
  user_id,
  event_date,
  time_slot,
  event_type,
  guests,
  total_price,
  deposit_amount,
  status,
  notes,
  created_at
) VALUES (
  NULL,  -- o buscar user_id por email
  $1,    -- date
  $2,    -- timeSlot
  $3,    -- eventType
  $4,    -- guests
  $5,    -- totalPrice
  $6,    -- depositAmount
  'pending',
  $7,    -- message
  NOW()
)
RETURNING id;
```

### Credenciales de Neon (desde .env)
```env
DATABASE_URL=postgresql://neondb_owner:npg_zr5iRHB3pgLw@ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

## Crear Evento en Google Calendar

### API de Google Calendar
```javascript
// Formato de fecha/hora para Google Calendar
const startDateTime = new Date(`${date}T${time}:00`);
const endDateTime = new Date(startDateTime);
endDateTime.setHours(endDateTime.getHours() + parseInt(duration));

{
  "summary": `HappyHub - ${name} (${eventType})`,
  "description": `
    Cliente: ${name}
    Email: ${email}
    Teléfono: ${phone}
    Invitados: ${guests}
    Extras: ${extras.join(', ')}
    Mensaje: ${message}

    Total: ${totalPrice}€
    Señal: ${depositAmount}€
  `,
  "start": {
    "dateTime": startDateTime.toISOString(),
    "timeZone": "Europe/Madrid"
  },
  "end": {
    "dateTime": endDateTime.toISOString(),
    "timeZone": "Europe/Madrid"
  },
  "attendees": [
    { "email": email }
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "email", "minutes": 1440 },  // 1 día antes
      { "method": "popup", "minutes": 60 }     // 1 hora antes
    ]
  }
}
```

## Crear Stripe Payment Link (Opcional)

### API de Stripe
```javascript
// Crear Payment Link
const paymentLink = await stripe.paymentLinks.create({
  line_items: [
    {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Señal Reserva HappyHub - ${date}`,
          description: `Señal del 30% para reserva ${reservationId}`,
        },
        unit_amount: depositAmount * 100, // Stripe usa céntimos
      },
      quantity: 1,
    },
  ],
  metadata: {
    reservationId: reservationId,
    customerEmail: email,
    customerPhone: phone,
  },
  after_completion: {
    type: 'redirect',
    redirect: {
      url: `https://happyhub.es/reserva/${reservationId}/confirmada`
    }
  }
});

// Devolver payment_link.url
```

## Variables de Entorno Necesarias en n8n

```env
# WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxx
ADMIN_WHATSAPP_NUMBER=+34638390600

# Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:npg_zr5iRHB3pgLw@ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_live_...

# Email (SendGrid, Mailgun, etc.)
SENDGRID_API_KEY=SG.xxxxxxxxxx
```

## Testing del Flujo

### 1. Test desde Frontend Local
```bash
# Iniciar servidor
npm run dev

# Ir a http://localhost:3000/reservas
# Completar formulario
# Verificar que se envía correctamente a n8n
```

### 2. Test Directo con curl
```bash
curl -X POST https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+34666555444",
    "eventType": "cumpleaños",
    "date": "2026-03-20",
    "time": "16:30",
    "timeSlot": "afternoon",
    "guests": 25,
    "duration": "4",
    "extras": ["catering"],
    "basePrice": 185,
    "totalPrice": 560,
    "depositAmount": 168,
    "source": "web",
    "timestamp": "2026-02-22T20:00:00Z"
  }'
```

### 3. Verificar Respuesta
Debe retornar:
```json
{
  "success": true,
  "reservationId": "RES-20260222-XXX",
  "message": "Reserva creada exitosamente"
}
```

## Notas Importantes

1. **Rate Limiting**: WhatsApp Business tiene límites de mensajes. Monitorear uso.

2. **Templates de WhatsApp**: Deben estar pre-aprobados por Meta antes de usar.

3. **Fallback de Email**: Si WhatsApp falla, enviar email como backup.

4. **Logs**: Guardar todos los eventos en tabla `reservation_logs` para debugging.

5. **IDs de Reserva**: Usar formato `RES-YYYYMMDD-NNN` para fácil identificación.

6. **Webhook Timeout**: n8n debe responder en <10 segundos. Procesos largos en background.

7. **Idempotencia**: Si n8n recibe la misma solicitud 2 veces (retry), no duplicar reserva.

## Próximos Pasos

- [ ] Crear template de WhatsApp en Meta Business Manager
- [ ] Configurar workflow de n8n con los nodos descritos
- [ ] Probar integración completa
- [ ] Configurar monitoring y alertas
- [ ] Documentar casos de error y recovery

---

**Documentación actualizada:** 2026-02-22
**Responsable:** Equipo HappyHub
