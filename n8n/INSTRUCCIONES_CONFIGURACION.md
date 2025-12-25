# Instrucciones de Configuración del Flujo n8n - HappyHub Reservas

## Descripción del Flujo

Este flujo n8n gestiona completamente el proceso de reservas en HappyHub con validación de disponibilidad:

1. **Recibe la solicitud de reserva** vía webhook POST
2. **Normaliza los datos** de entrada (soporta campos en español e inglés)
3. **Verifica disponibilidad** en Google Calendar para la fecha/hora solicitada
4. **Valida disponibilidad**:
   - Si hay conflicto → Responde con error 409 y mensaje de fecha no disponible
   - Si está libre → Continúa con la creación de la reserva
5. **Crea evento en Google Calendar** con todos los detalles
6. **Guarda la reserva en Airtable** con referencia al evento de calendario
7. **Genera link de pago en Stripe** con metadata de la reserva
8. **Genera mensaje personalizado** con Claude AI
9. **Envía email de confirmación** con diseño HTML profesional
10. **Responde al frontend** con datos de la reserva y link de pago

## URL del Webhook

```
https://n8n-happyhub-n8n.c13yv5.easypanel.host/webhook/reserva-happyhub
```

## Requisitos Previos

### 1. Credenciales de Google Calendar
- Crear proyecto en Google Cloud Console
- Habilitar Google Calendar API
- Crear credenciales OAuth 2.0
- Agregar scopes: `calendar.events.readonly` y `calendar.events`

### 2. Credenciales de Airtable
- Obtener Personal Access Token desde Airtable
- Crear base con la siguiente estructura de tabla:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Single line text | Nombre del cliente |
| Email | Email | Email del cliente |
| Teléfono | Phone number | Teléfono del cliente |
| Fecha | Date | Fecha del evento (YYYY-MM-DD) |
| Hora | Single line text | Hora del evento (HH:MM) |
| Personas | Number | Cantidad de invitados |
| Duración | Number | Duración en horas |
| Extras | Long text | Servicios extra separados por coma |
| TipoEvento | Single select | Cumpleaños, Comunión, Bautizo, etc. |
| MétodoPago | Single select | Stripe, Transferencia, etc. |
| PrecioTotal | Currency | Precio total de la reserva |
| Estado | Single select | Pendiente de Pago, Confirmado, Cancelado |
| EventoCalendarioID | Single line text | ID del evento en Google Calendar |
| FechaCreación | Date | Timestamp de creación |

### 3. Credenciales de Stripe
- Obtener Secret Key desde Stripe Dashboard
- Configurar webhooks en Stripe (si aún no está configurado)

### 4. Credenciales de Anthropic (Claude AI)
- Obtener API Key desde https://console.anthropic.com
- Configurar como HTTP Header Authentication en n8n

### 5. Credenciales SMTP
- Configurar servidor SMTP (Gmail, SendGrid, Mailgun, etc.)
- Para Gmail: activar "App Password" en configuración de seguridad

## Paso a Paso: Importar y Configurar el Flujo

### 1. Importar el Flujo en n8n

1. Acceder a tu instancia de n8n: `https://n8n-happyhub-n8n.c13yv5.easypanel.host`
2. Hacer clic en el menú hamburguesa (☰) → **Import**
3. Seleccionar el archivo `n8n-reserva-con-validacion.json`
4. El flujo se importará con todos los nodos configurados

### 2. Configurar Credenciales en n8n

#### Google Calendar OAuth2
1. Ir a Settings → Credentials → Add Credential
2. Buscar "Google Calendar OAuth2 API"
3. Ingresar:
   - **Client ID**: Tu Client ID de Google Cloud
   - **Client Secret**: Tu Client Secret de Google Cloud
   - **Scope**: `https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events`
4. Hacer clic en "Connect my account" y autorizar
5. Guardar con nombre: "Google Calendar HappyHub"

#### Airtable Token API
1. Ir a Settings → Credentials → Add Credential
2. Buscar "Airtable Personal Access Token API"
3. Ingresar tu Personal Access Token de Airtable
4. Guardar con nombre: "Airtable HappyHub"

#### Stripe API
1. Ir a Settings → Credentials → Add Credential
2. Buscar "Stripe API"
3. Ingresar tu Secret Key de Stripe
4. Guardar con nombre: "Stripe HappyHub"

#### Anthropic API
1. Ir a Settings → Credentials → Add Credential
2. Buscar "Anthropic API"
3. Ingresar tu API Key de Anthropic
4. Guardar con nombre: "Anthropic API"

#### SMTP
1. Ir a Settings → Credentials → Add Credential
2. Buscar "SMTP"
3. Ingresar configuración de tu servidor SMTP:
   - **Host**: smtp.gmail.com (para Gmail)
   - **Port**: 587
   - **User**: tu-email@gmail.com
   - **Password**: Tu App Password
   - **Secure**: Activar TLS
4. Guardar con nombre: "SMTP HappyHub"

### 3. Configurar Nodos con tus IDs

#### Nodo "Guardar en Airtable"
1. Hacer doble clic en el nodo
2. Actualizar:
   - **Base ID**: Tu Base ID de Airtable (empieza con `app...`)
   - **Table ID**: Tu Table ID de Airtable (empieza con `tbl...`)
3. Guardar cambios

Para obtener IDs de Airtable:
- Base ID: Visible en la URL cuando abres tu base
- Table ID: Hacer clic en Help → API documentation → Encontrar el ID en la documentación

#### Nodo "Crear Link de Pago Stripe" (opcional)
Si deseas usar un Price ID fijo de Stripe en lugar de calcular dinámicamente:
1. Crear un producto en Stripe Dashboard
2. Copiar el Price ID
3. Modificar el nodo para usar ese Price ID

### 4. Configurar URL de Redirección (Opcional)

El flujo ya viene configurado con la URL `https://happyhub.es` para la redirección después del pago. Si necesitas usar una URL diferente:

1. Editar el nodo "Crear Link de Pago Stripe"
2. Buscar el campo `afterCompletion` → `url`
3. Cambiar `https://happyhub.es` por tu dominio

**Para desarrollo local:**
- Cambiar a: `http://localhost:3000/mi-reserva/{{$json.id}}`
- **Nota:** Stripe requiere HTTPS en producción, usa ngrok para testing local

**Nota sobre Variables de Entorno:**
La funcionalidad de "Environments" requiere el plan Enterprise de n8n. Por eso, la URL está hardcodeada directamente en el flujo. Si tienes Enterprise, puedes usar `={{$env.NEXTAUTH_URL}}/mi-reserva/{{$json.id}}` en su lugar.

### 5. Activar el Flujo

1. Hacer clic en el botón "Active" en la parte superior derecha del flujo
2. El webhook estará disponible en: `https://n8n-happyhub-n8n.c13yv5.easypanel.host/webhook/reserva-happyhub`
3. Copiar la URL del webhook para usarla en tu aplicación

## Probar el Flujo

### Prueba desde Postman o cURL

```bash
curl -X POST https://n8n-happyhub-n8n.c13yv5.easypanel.host/webhook/reserva-happyhub \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+34612345678",
    "eventType": "Cumpleaños",
    "date": "2024-12-25",
    "time": "18:00",
    "guests": 20,
    "duration": "4",
    "extras": ["Catering", "Decoración"],
    "paymentMethod": "stripe",
    "totalPrice": 500,
    "message": "Queremos decoración temática de superhéroes"
  }'
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Reserva creada exitosamente",
  "reservationId": "rec123456789",
  "paymentLink": "https://buy.stripe.com/...",
  "calendarEventId": "abcd1234efgh5678",
  "fecha": "25/12/2024",
  "hora": "18:00h"
}
```

### Respuesta de Conflicto (409)
```json
{
  "success": false,
  "error": "Lo siento, la fecha y hora indicada ya está reservada.",
  "message": "Lo siento, la fecha y hora indicada ya está reservada.",
  "fechaSolicitada": "25/12/2024",
  "horaSolicitada": "18:00h"
}
```

## Integración con el Frontend

El endpoint `/api/webhook-reserva.ts` en Next.js ya está configurado para usar el webhook de n8n. Verifica que la variable de entorno esté configurada:

```env
N8N_WEBHOOK_URL=https://n8n-happyhub-n8n.c13yv5.easypanel.host/webhook/reserva-happyhub
```

## Monitoreo y Debugging

### Ver Ejecuciones
1. En n8n, ir a **Executions** en el menú lateral
2. Ver todas las ejecuciones del flujo con datos de entrada/salida

### Logs de Errores
- Cada nodo muestra errores en rojo si falla
- Hacer clic en el nodo para ver detalles del error

### Testing Individual de Nodos
1. Hacer clic en "Execute Workflow" para probar manualmente
2. Hacer clic en "Listen for Test Event" en el nodo Webhook
3. Enviar una solicitud de prueba desde Postman

## Optimizaciones Recomendadas

### 1. Caché de Disponibilidad
Considera agregar un nodo Redis para cachear disponibilidad y reducir llamadas a Google Calendar API.

### 2. Notificaciones a Admin
Agregar un nodo para enviar notificación a admin@happyhub.es cuando se cree una nueva reserva.

### 3. Recordatorios Automáticos
Crear un flujo separado con Schedule Trigger para enviar recordatorios 24h antes del evento.

### 4. Manejo de Cancelaciones
Agregar endpoint adicional para manejar cancelaciones y actualizar calendario + Airtable.

## Mantenimiento

### Actualizar el Modelo de Claude AI
El flujo usa `claude-3-5-sonnet-20241022`. Para actualizar:
1. Editar nodo "Generar Mensaje con Claude AI"
2. Cambiar el campo `model` en el JSON body
3. Opciones: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, etc.

### Actualizar Templates de Email
El HTML del email está en el nodo "Enviar Email de Confirmación". Editar directamente el campo "message".

## Soporte

Para problemas o dudas:
- Revisar logs en n8n: Executions → Ver detalles de ejecución fallida
- Verificar credenciales: Settings → Credentials → Test connection
- Revisar cuotas de APIs externas (Google Calendar, Anthropic, Stripe)

## Diagrama de Flujo

```
Webhook POST
    ↓
Normalizar Datos
    ↓
Verificar Disponibilidad (Google Calendar API)
    ↓
¿Fecha Disponible?
    ├─ NO → Respuesta 409 (Fecha No Disponible)
    │
    └─ SÍ → Crear Evento en Calendario
               ↓
            Guardar en Airtable
               ↓
            ┌──────────┴──────────┐
            ↓                     ↓
    Crear Payment Link    Generar Mensaje IA
         (Stripe)            (Claude AI)
            ↓                     ↓
            └──────────┬──────────┘
                       ↓
            Preparar Contenido Email
                       ↓
            ┌──────────┴──────────┐
            ↓                     ↓
    Enviar Email          Respuesta 200
     Confirmación      (Reserva Exitosa)
```

## Notas de Seguridad

1. **Webhook URL**: Considerar agregar autenticación (API key en headers)
2. **Rate Limiting**: Implementar límite de requests por IP
3. **Validación de Datos**: El nodo "Normalizar Datos" valida estructura básica
4. **Secrets**: Todas las API keys deben estar en credenciales de n8n, NUNCA en código
5. **CORS**: Configurar CORS en n8n si el frontend está en dominio diferente

---

**Versión**: 1.0
**Última actualización**: 22 de diciembre de 2024
**Autor**: HappyHub Dev Team
