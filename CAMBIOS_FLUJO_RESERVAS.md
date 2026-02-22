# Cambios en Flujo de Reservas - WhatsApp Business

**Fecha:** 2026-02-22
**Estado:** ✅ Frontend completado, pendiente configuración n8n

## Resumen de Cambios

### Antes
```
Usuario → Formulario → Stripe Checkout → Pago → Confirmación
```

### Ahora
```
Usuario → Formulario → n8n Webhook → [WhatsApp + BD + Calendar + Email] → Confirmación
```

## Archivos Modificados

### 1. `src/components/booking/Step3CustomerData.tsx`
**Cambios:**
- Envía datos directamente a `/api/webhook-reserva` en lugar de Stripe
- Incluye todos los datos necesarios para n8n
- Botón cambiado de "Pagar señal" a "Solicitar reserva"
- Mensaje de seguridad actualizado para WhatsApp/Email

**Datos enviados a n8n:**
```javascript
{
  name, email, phone, eventType, message,
  date, time, timeSlot, guests, duration, extras,
  basePrice, totalPrice, depositAmount,
  source: 'web', timestamp
}
```

### 2. `src/components/booking/BookingWizard.tsx`
**Cambios:**
- Añadido Step 4 (Confirmación)
- Actualizada descripción del Step 3

### 3. `src/components/booking/Step4Confirmation.tsx` (NUEVO)
**Características:**
- Pantalla de éxito con check verde
- Muestra número de reserva
- Resumen completo de la reserva
- Info sobre próximos pasos (WhatsApp, Email, Pago)
- Breakdown de precios (total y señal)
- Botón para volver al inicio

### 4. `src/pages/api/webhook-reserva.ts`
**Estado:** Ya existía, no requiere cambios
**Función:** Forward datos a n8n

## Lo que n8n Debe Hacer

### 1. Recibir Webhook
```
POST /webhook/reservation-request
```

### 2. Procesar Reserva
1. ✅ Validar disponibilidad (Google Calendar)
2. ✅ Guardar en base de datos (Neon PostgreSQL)
3. ✅ Crear evento en Google Calendar
4. ✅ Generar ID de reserva (RES-YYYYMMDD-NNN)
5. ✅ Enviar WhatsApp al cliente (template pre-aprobado)
6. ✅ Enviar WhatsApp al admin
7. ✅ Enviar email de confirmación
8. ✅ [Opcional] Crear Stripe Payment Link
9. ✅ Responder al webhook con `{ success: true, reservationId: "..." }`

### 3. Respuesta Esperada
```json
{
  "success": true,
  "reservationId": "RES-20260222-001",
  "message": "Reserva creada exitosamente"
}
```

## Configuración de WhatsApp Business

### Template Requerido en Meta
**Nombre:** `reserva_confirmada`

```
¡Hola {{1}}! 🎉

Tu reserva en HappyHub ha sido recibida correctamente.

📅 Fecha: {{2}}
🕐 Hora: {{3}}
💰 Total: {{4}}
💳 Señal: {{5}}
🔖 Nº Reserva: {{6}}

Te enviamos el enlace de pago:
{{7}}

Nos pondremos en contacto contigo en 24h.

¿Dudas? Responde este mensaje.

Gracias por confiar en HappyHub 💙
```

### Variables de Entorno (n8n)
```env
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
ADMIN_WHATSAPP_NUMBER=+34638390600
DATABASE_URL=postgresql://...
GOOGLE_CALENDAR_ID=...
STRIPE_SECRET_KEY=sk_live_...
```

## Testing

### Desde Frontend
```bash
# 1. Servidor corriendo
npm run dev

# 2. Ir a http://localhost:3000/reservas
# 3. Completar wizard (3 pasos)
# 4. Ver confirmación (paso 4)
```

### Datos de Prueba
- Nombre: Test Usuario
- Email: test@example.com
- Teléfono: +34666555444
- Fecha: Cualquier día futuro
- Hora: Afternoon (16:30)
- Invitados: 30
- Tipo: Cumpleaños

### Verificar
1. ✅ Webhook recibido en n8n
2. ✅ Datos correctos en formato JSON
3. ✅ Respuesta con reservationId
4. ✅ Frontend muestra confirmación

## Estructura de Base de Datos (Neon)

### Tabla: reservations
```sql
INSERT INTO reservations (
  event_date,          -- date
  time_slot,           -- timeSlot
  event_type,          -- eventType
  guests,              -- guests
  total_price,         -- totalPrice
  deposit_amount,      -- depositAmount
  status,              -- 'pending'
  notes,               -- message
  created_at           -- NOW()
) VALUES (...);
```

## Ventajas del Nuevo Flujo

1. ✅ **WhatsApp Business**: Contacto directo con clientes
2. ✅ **Flexibilidad**: n8n maneja toda la lógica
3. ✅ **Base de Datos**: Todo guardado en Neon
4. ✅ **Sin Stripe inicial**: Pago después de confirmación
5. ✅ **Notificaciones**: Múltiples canales (WhatsApp + Email)
6. ✅ **Tracking**: Todo registrado en BD
7. ✅ **Escalabilidad**: Fácil añadir más integraciones

## Próximos Pasos

### Inmediatos
- [ ] Crear template WhatsApp en Meta Business Manager
- [ ] Configurar workflow n8n completo
- [ ] Probar flujo end-to-end
- [ ] Verificar que llegan WhatsApp y emails

### Opcionales
- [ ] Panel de admin para ver reservas
- [ ] Notificaciones a proveedores de extras
- [ ] Integración con CRM
- [ ] Analytics de conversión

## Documentación Adicional

- `n8n/FLUJO_WHATSAPP_BUSINESS.md` - Documentación detallada del workflow
- `.env` - Credenciales de Neon configuradas
- `migration/neon-migration-complete.md` - Migración a Neon completada

---

**Frontend listo para probar** ✅
**Workflow n8n pendiente de configuración** ⏳

**Desarrollador:** Claude Code
**Fecha:** 2026-02-22
