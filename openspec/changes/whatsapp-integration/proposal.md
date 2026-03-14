## Why

WhatsApp es la herramienta de comunicacion principal de los usuarios target. La gente usa WhatsApp como file exchange, album de fotos, canal de decisiones y organizador informal de eventos. En lugar de competir contra WhatsApp o ignorarlo, la estrategia es integrarse: usar WhatsApp como canal de distribucion y entrada de datos, y HappyHub como el hub estructurado.

## What changes

### Fase 1 - Compartir y notificar (sin API)
- Botones "Compartir en WhatsApp" en: invitaciones al evento, resultados de votaciones, resumen de gastos
- Links profundos que abren WhatsApp con mensaje pre-formateado
- Web Share API como fallback para compartir en cualquier app
- Notificaciones de reserva y estado via n8n + WhatsApp Business (ya parcialmente implementado)

### Fase 2 - WhatsApp Business API
- Envio de notificaciones template: recordatorios de evento, tareas pendientes, votaciones abiertas
- Mensaje interactivo con botones: confirmar RSVP, votar si/no, ver detalle
- Recepcion de fotos: usuario envia foto al numero de WhatsApp del evento, se agrega al album automaticamente

### Fase 3 - WhatsApp Flows (avanzado)
- Formularios nativos en WhatsApp para: RSVP, votaciones simples, confirmar pago
- Sin necesidad de abrir el navegador para acciones simples

## Capabilities

### New capabilities
- `whatsapp-share-links`: Botones de compartir con mensaje pre-formateado via WhatsApp deep links
- `whatsapp-notifications`: Notificaciones template via WhatsApp Business API
- `whatsapp-photo-receive`: Recepcion de fotos enviadas al numero del evento
- `whatsapp-interactive`: Mensajes con botones interactivos (RSVP, votaciones)

### Modified capabilities
- `collaborative-event-invite`: Opcion de invitar via WhatsApp (link profundo)
- `collaborative-voting`: Compartir votacion en WhatsApp, votar via botones interactivos
- `event-photo-album`: Recibir fotos enviadas por WhatsApp

## Impact

**Fase 1 (sin coste, implementacion rapida):**

Solo requiere generar URLs con el formato:
```
https://wa.me/?text={encodedMessage}
```

Mensajes pre-formateados por tipo:
- Invitacion: "Te invito a {evento}! Unete aqui: {url}"
- Votacion: "Vota en {evento}: {pregunta}. {url}"
- Gastos: "Nuevo gasto en {evento}: {descripcion} ({importe}EUR). Ver saldos: {url}"

**Fase 2 (WhatsApp Business API - coste mensual):**

Requiere:
- Cuenta de WhatsApp Business verificada
- WhatsApp Business API via proveedor (Twilio, MessageBird, 360dialog)
- Templates de mensaje aprobados por Meta
- Webhook para recibir mensajes entrantes (fotos)
- Coste: ~0.05-0.10 EUR por mensaje template

Nuevas tablas:
```sql
CREATE TABLE whatsapp_messages (
  id SERIAL PRIMARY KEY,
  event_id INTEGER,
  event_type VARCHAR(50),
  recipient_phone VARCHAR(20),
  template_name VARCHAR(100),
  status VARCHAR(50), -- sent, delivered, read, failed
  external_id VARCHAR(255), -- ID del proveedor
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API endpoints:**
- `POST /api/whatsapp/send-invite` - Enviar invitacion via WhatsApp
- `POST /api/whatsapp/send-notification` - Enviar notificacion template
- `POST /api/whatsapp/webhook` - Webhook para mensajes entrantes (fotos, respuestas)

**UI components:**
- `WhatsAppShareButton` - Boton de compartir en WhatsApp (deep link, fase 1)
- `WhatsAppInviteForm` - Formulario para enviar invitaciones con numero de telefono (fase 2)

**Estrategia de implementacion:**
1. Fase 1 primero: cero coste, se implementa en 1-2 dias, da valor inmediato
2. Fase 2 cuando haya traccion: requiere cuenta business y presupuesto de mensajes
3. Fase 3 solo si hay volumen significativo y el ROI justifica la complejidad
