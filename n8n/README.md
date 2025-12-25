# Flujo n8n para Gestión de Reservas - HappyHub

> ⚠️ **IMPORTANTE:** Si no tienes plan Enterprise de n8n (como en tu caso), la configuración de URLs se hace directamente en el flujo. Ya está resuelto - ver [CONFIGURACION_URL.md](./CONFIGURACION_URL.md)

## Descripción General

Sistema automatizado de gestión de reservas con validación de disponibilidad en tiempo real, integración con Google Calendar, Airtable, Stripe y Claude AI.

## 🚀 Inicio Rápido

**¿Primera vez?** → Lee **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)** (10 minutos)

**¿Necesitas ver el índice completo?** → [INDEX.md](./INDEX.md)

## Archivos en este Directorio

- **n8n-reserva-con-validacion.json**: Flujo completo listo para importar en n8n
- **n8n-nodes.json**: Flujo original (legacy, sin validación de disponibilidad)
- **INSTRUCCIONES_CONFIGURACION.md**: Guía detallada paso a paso para configurar el flujo

## Características Principales

### ✅ Validación de Disponibilidad
- Verifica automáticamente si la fecha/hora está disponible en Google Calendar
- Previene reservas duplicadas o conflictos de horario
- Respuesta inmediata al usuario si la fecha no está disponible

### 📅 Integración con Google Calendar
- Crea eventos automáticamente con todos los detalles de la reserva
- Sincronización bidireccional (lee y escribe en el calendario)
- Envía invitaciones a los participantes

### 💾 Almacenamiento en Airtable
- Base de datos centralizada de todas las reservas
- Tracking completo del estado de cada reserva
- Referencia cruzada con eventos de Google Calendar

### 💳 Procesamiento de Pagos con Stripe
- Genera links de pago personalizados automáticamente
- Metadata completa para tracking de pagos
- Redirección automática después del pago

### 🤖 Personalización con IA
- Mensajes de confirmación generados por Claude AI
- Contenido personalizado según tipo de evento y cliente
- Tono amable y profesional

### 📧 Email de Confirmación
- Diseño HTML responsive y profesional
- Incluye todos los detalles de la reserva
- Link directo para completar el pago

## Flujo de Trabajo

```
1. Cliente envía solicitud de reserva
           ↓
2. n8n recibe datos vía webhook
           ↓
3. Normaliza y valida datos
           ↓
4. Consulta Google Calendar
           ↓
   ┌──────┴──────┐
   ↓             ↓
5a. Fecha      5b. Fecha disponible
    ocupada         ↓
   ↓            Crea evento en calendario
   Envía error      ↓
   409          Guarda en Airtable
                    ↓
                Genera link de pago
                    ↓
                Genera mensaje IA
                    ↓
                Envía email
                    ↓
                Responde con éxito
```

## Respuestas del Webhook

### ✅ Reserva Exitosa (HTTP 200)
```json
{
  "success": true,
  "message": "Reserva creada exitosamente",
  "reservationId": "rec123abc456",
  "paymentLink": "https://buy.stripe.com/...",
  "calendarEventId": "abc123xyz789",
  "fecha": "25/12/2024",
  "hora": "18:00h"
}
```

### ❌ Fecha No Disponible (HTTP 409)
```json
{
  "success": false,
  "error": "Lo siento, la fecha y hora indicada ya está reservada.",
  "message": "Lo siento, la fecha y hora indicada ya está reservada.",
  "fechaSolicitada": "25/12/2024",
  "horaSolicitada": "18:00h"
}
```

## Datos de Entrada Esperados

El webhook acepta los siguientes campos (en español o inglés):

```json
{
  "name": "Juan Pérez",                    // o "nombre"
  "email": "juan@example.com",
  "phone": "+34612345678",                 // o "telefono"
  "eventType": "Cumpleaños",               // o "tipoEvento"
  "date": "2024-12-25",                    // o "fecha" (YYYY-MM-DD)
  "time": "18:00",                         // o "hora" (HH:MM)
  "guests": 20,                            // o "pax"
  "duration": "4",                         // o "duracion" (horas)
  "extras": ["Catering", "Decoración"],
  "paymentMethod": "stripe",               // o "metodoPago"
  "totalPrice": 500,                       // o "precioTotal"
  "message": "Notas adicionales"           // o "mensaje" (opcional)
}
```

## Configuración Rápida

### 1. Importar el Flujo
```bash
# Acceder a n8n
https://n8n-happyhub-n8n.c13yv5.easypanel.host

# Ir a: Menú → Import → Seleccionar archivo
n8n-reserva-con-validacion.json
```

### 2. Configurar Credenciales
Necesitas configurar 5 credenciales:
1. **Google Calendar OAuth2** - Para leer/escribir eventos
2. **Airtable Token API** - Para guardar reservas
3. **Stripe API** - Para generar links de pago
4. **Anthropic API** - Para generar mensajes con IA
5. **SMTP** - Para enviar emails

### 3. Actualizar IDs
En el nodo "Guardar en Airtable":
- **baseId**: Tu Base ID (empieza con `app...`)
- **tableId**: Tu Table ID (empieza con `tbl...`)

### 4. Activar el Flujo
Hacer clic en el botón "Active" en la esquina superior derecha.

## Testing

### Con cURL
```bash
curl -X POST https://n8n-happyhub-n8n.c13yv5.easypanel.host/webhook/reserva-happyhub \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+34600000000",
    "eventType": "Cumpleaños",
    "date": "2024-12-31",
    "time": "20:00",
    "guests": 15,
    "duration": "4",
    "totalPrice": 400
  }'
```

### Con JavaScript (Frontend)
```javascript
const response = await fetch('/api/webhook-reserva', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Juan Pérez",
    email: "juan@example.com",
    phone: "+34612345678",
    eventType: "Cumpleaños",
    date: "2024-12-25",
    time: "18:00",
    guests: 20,
    duration: "4",
    extras: ["Catering"],
    paymentMethod: "stripe",
    totalPrice: 500
  })
});

const data = await response.json();
if (data.success) {
  // Redirigir a página de éxito o mostrar link de pago
  window.location.href = `/mi-reserva/${data.reservationId}`;
} else {
  // Mostrar error al usuario
  alert(data.error || data.message);
}
```

## Integraciones Externas

### Google Calendar
- **API**: Google Calendar API v3
- **Scopes**: `calendar`, `calendar.events`
- **Operaciones**: `getAll` (verificar), `create` (crear evento)

### Airtable
- **API**: Airtable Web API v2
- **Auth**: Personal Access Token
- **Operaciones**: `append` (crear registro)

### Stripe
- **API**: Stripe API v1
- **Resource**: Payment Links
- **Operaciones**: `create` (generar link)

### Claude AI (Anthropic)
- **API**: Anthropic Messages API
- **Model**: claude-3-5-sonnet-20241022
- **Max Tokens**: 300

### SMTP
- **Protocol**: SMTP/TLS
- **Port**: 587 (recomendado)
- **Format**: HTML + Plain Text

## Monitoreo

### Ver Ejecuciones en n8n
1. Ir a **Executions** en el menú lateral
2. Filtrar por estado: Success / Error
3. Ver detalles completos de cada ejecución

### Métricas Importantes
- **Tasa de éxito**: % de reservas completadas vs. errores
- **Disponibilidad**: % de solicitudes rechazadas por fecha ocupada
- **Tiempo de respuesta**: Duración promedio del flujo
- **Tasa de conversión de pago**: % de pagos completados

## Troubleshooting

### Error: "Lo siento, la fecha y hora indicada ya está reservada"
- **Causa**: Ya existe un evento en Google Calendar para esa fecha/hora
- **Solución**: Usuario debe elegir otra fecha/hora

### Error: "N8N_WEBHOOK_URL no está configurada"
- **Causa**: Variable de entorno faltante en Next.js
- **Solución**: Agregar en `.env`: `N8N_WEBHOOK_URL=https://...`

### Error: "Invalid credentials"
- **Causa**: Credenciales expiradas o incorrectas
- **Solución**: Reconfigurar credenciales en Settings → Credentials

### Email no se envía
- **Causa**: Configuración SMTP incorrecta
- **Solución**: Verificar host, puerto, usuario y password SMTP

## Roadmap / Mejoras Futuras

- [ ] Agregar webhook para manejar cancelaciones
- [ ] Implementar recordatorios automáticos 24h antes
- [ ] Sistema de notificaciones push para admins
- [ ] Dashboard analytics con métricas de reservas
- [ ] Integración con WhatsApp Business API
- [ ] Sistema de reviews post-evento
- [ ] Generación automática de facturas

## Soporte

Para configuración y troubleshooting detallado, consultar:
- **Guía completa**: `INSTRUCCIONES_CONFIGURACION.md`
- **Documentación n8n**: https://docs.n8n.io
- **Issues del proyecto**: Contactar al equipo de desarrollo

---

**Estado**: ✅ Producción
**Versión**: 1.0
**Última actualización**: 22 de diciembre de 2024
