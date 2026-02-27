# Configurar Flujo de Aprobación en n8n

Guía para configurar el workflow de aprobación de reservas con WhatsApp en n8n.

## Requisitos Previos

✅ n8n corriendo en http://52.208.80.224:5678
✅ WhatsApp Business API token configurado: `WHATSAPP_API_TOKEN`
✅ Database migration ejecutada (campos approval en reservations)
✅ Código desplegado a producción

## Acceso a n8n

```bash
# URL
http://52.208.80.224:5678

# Credenciales
Usuario: admin
Contraseña: ChangeThisPassword123! (cambiar en primer login)
```

## Pasos de Configuración

### Fase 1: Workflow de Nueva Reserva (Tareas 5.1-5.6)

1. **Abrir workflow existente:**
   - Workflow: "Reservation Request" o similar
   - O crear nuevo: "Reservation Approval Flow"

2. **Añadir nodo "Send Customer Confirmation Email":**
   ```
   Node Type: Send Email (SMTP/Gmail)
   Position: Después de "Create Reservation"

   Configuration:
   - To: {{ $json.customer_email }}
   - Subject: "Reserva recibida - En revisión"
   - Body (HTML):
   ```html
   <h2>¡Reserva Recibida!</h2>
   <p>Hola {{ $json.customer_name }},</p>
   <p>Hemos recibido tu solicitud de reserva y la estamos revisando.</p>

   <h3>Resumen de tu reserva:</h3>
   <ul>
     <li><strong>Fecha:</strong> {{ $json.event_date }}</li>
     <li><strong>Horario:</strong> {{ $json.time_slot }}</li>
     <li><strong>Invitados:</strong> {{ $json.guests }}</li>
     <li><strong>Precio total:</strong> {{ $json.total_price }}€</li>
   </ul>

   <p>Te contactaremos en breve para confirmar o sugerir alternativas.</p>
   <p>Gracias,<br>Equipo HappyHub</p>
   ```

3. **Test email node:**
   - Click "Execute Node"
   - Verifica email llega a tu inbox

### Fase 2: Notificación WhatsApp a Admin (Tareas 6.1-6.7)

4. **Añadir nodo "HTTP Request - Send WhatsApp to Admin":**
   ```
   Node Type: HTTP Request
   Position: Después de "Send Customer Confirmation Email"

   Configuration:
   - Method: POST
   - URL: https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages
   - Authentication: Header Auth
     - Name: Authorization
     - Value: Bearer {{ $env.WHATSAPP_API_TOKEN }}

   - Body (JSON):
   ```json
   {
     "messaging_product": "whatsapp",
     "to": "34624645517",
     "type": "text",
     "text": {
       "preview_url": true,
       "body": "🆕 Nueva Reserva #{{ $json.reservation_id }}\n\n👤 {{ $json.customer_name }}\n📧 {{ $json.customer_email }}\n📞 {{ $json.customer_phone }}\n\n📅 Fecha: {{ $json.event_date }}\n⏰ Horario: {{ $json.time_slot }}\n🎉 Tipo: {{ $json.event_type }}\n👥 Invitados: {{ $json.guests }}\n💰 Precio: {{ $json.total_price }}€\n\n👉 Revisar y aprobar:\nhttps://www.happyhub.es/admin/approve-reservation/{{ $json.reservation_id }}"
     }
   }
   ```

5. **Añadir nodo "Error Handler - Email Fallback":**
   ```
   Node Type: Send Email
   Position: Conectado a "On Error" del nodo WhatsApp

   Configuration:
   - To: happyhub.rovellat@gmail.com
   - Subject: "⚠️ Nueva Reserva (WhatsApp failed)"
   - Body: Same content as WhatsApp message
   ```

6. **Test WhatsApp node:**
   - Execute workflow
   - Verifica WhatsApp llega a +34 624 645 517
   - Verifica link funciona y abre página de aprobación

### Fase 3: Notificaciones de Aprobación/Rechazo (Tareas 7.1-7.8)

7. **Crear webhook para status changes:**
   ```
   Node Type: Webhook
   Path: /webhook/reservation-status-changed
   Method: POST

   Expected payload:
   {
     "reservation_id": 123,
     "status": "approved" | "rejected",
     "customer_email": "customer@email.com",
     "customer_phone": "+34612345678",
     "customer_name": "María García",
     "rejection_reason": "..." (if rejected)
   }
   ```

8. **Añadir nodo "IF Approved/Rejected":**
   ```
   Node Type: IF
   Condition: {{ $json.status }} equals "approved"

   TRUE branch: Send approval notifications
   FALSE branch: Send rejection notifications
   ```

9. **TRUE branch - Approval Email:**
   ```
   Node Type: Send Email
   To: {{ $json.customer_email }}
   Subject: "✅ Reserva Aprobada - HappyHub"
   Body:
   ```html
   <h2>¡Reserva Aprobada!</h2>
   <p>Hola {{ $json.customer_name }},</p>
   <p>Tu reserva ha sido aprobada. En breve recibirás el enlace de pago.</p>
   <p><a href="https://www.happyhub.es/mi-reserva/{{ $json.reservation_id }}">Ver mi reserva</a></p>
   ```

10. **TRUE branch - Approval WhatsApp:**
    ```
    Node Type: HTTP Request (WhatsApp API)
    Body: Use sendApprovalNotificationToCustomer format from whatsapp.ts
    ```

11. **FALSE branch - Rejection Email:**
    ```
    Node Type: Send Email
    Subject: "❌ Reserva No Disponible - HappyHub"
    Body: Include {{ $json.rejection_reason }}
    ```

12. **FALSE branch - Rejection WhatsApp:**
    ```
    Node Type: HTTP Request (WhatsApp API)
    Body: Use sendRejectionNotificationToCustomer format from whatsapp.ts
    ```

### Fase 4: Integración con Código (Tarea 8.1-8.5)

13. **Llamar webhook desde API approve/reject:**
    - Los endpoints ya están creados
    - Falta añadir llamada a n8n webhook después de actualizar DB
    - Ver archivo: `src/pages/api/admin/reservations/[id]/approve.ts`
    - Añadir después de UPDATE:
    ```typescript
    // Trigger n8n notification workflow
    await axios.post(`${process.env.N8N_WEBHOOK_URL}/reservation-status-changed`, {
      reservation_id: reservationId,
      status: 'approved',
      customer_email: reservation.user_email,
      customer_phone: reservation.user_phone,
      customer_name: reservation.user_name,
    });
    ```

## Variables de Entorno Necesarias

Añadir a n8n (Settings → Environment Variables):

```bash
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id_de_meta
WHATSAPP_API_TOKEN=EAAXSgOo4ZA0oBQ5fZCCHCFXFp... (el token que guardaste)
```

## Testing

### Test 1: Nueva Reserva
1. Crear reserva de prueba desde formulario
2. Verificar:
   - ✓ Email "Reserva recibida" llega a cliente
   - ✓ WhatsApp llega a +34 624 645 517 con link
   - ✓ Link abre página de aprobación correctamente

### Test 2: Aprobar Reserva
1. Click en link de WhatsApp
2. Click "Aprobar Reserva"
3. Verificar:
   - ✓ Status cambia a 'approved' en base de datos
   - ✓ Email aprobación llega a cliente
   - ✓ WhatsApp aprobación llega a cliente

### Test 3: Rechazar Reserva
1. Click en link de WhatsApp
2. Click "Rechazar"
3. Escribir motivo: "Fecha no disponible"
4. Confirmar
5. Verificar:
   - ✓ Status cambia a 'rejected'
   - ✓ rejection_reason guardado en BD
   - ✓ Email rechazo llega con motivo
   - ✓ WhatsApp rechazo llega con motivo

## Troubleshooting

**WhatsApp no envía:**
- Verifica WHATSAPP_API_TOKEN es correcto
- Verifica WHATSAPP_PHONE_NUMBER_ID configurado
- Check n8n logs: `sudo docker-compose logs -f n8n`
- Verifica número de teléfono formato correcto (34XXXXXXXXX)

**Email no llega:**
- Check spam folder
- Verifica configuración SMTP en n8n
- Check n8n execution log

**Link de aprobación no funciona:**
- Verifica URL es https://www.happyhub.es (no localhost)
- Verifica reservation_id se pasa correctamente
- Check que página está desplegada en Amplify

## Próximos Pasos

Después de configurar n8n:
1. Update `docs/project_notes/key_facts.md` con URLs de webhook
2. Test flujo completo end-to-end
3. Marcar tareas 5.1-7.8 como completadas en tasks.md
4. Continuar con `/opsx:apply` si quedan tareas pendientes
