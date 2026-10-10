## Why

n8n es un punto único de fallo que no se puede mantener: el propietario no puede recuperar sus credenciales y, en las reservas de prueba del 2026-10-10, n8n guardó la reserva pero no envió ningún correo (los logs de Vercel solo muestran `Workflow was started`). Además:

- El **correo de verificación** de cuenta depende de n8n. Si falla, la web dice "enviado" pero no llega nada, y sin email verificado no se puede reservar.
- El workflow de reserva construye el SQL concatenando los datos del formulario: riesgo de **inyección SQL**.
- Los permisos OAuth de Google en n8n caducan (Gmail / Calendar).

La inauguración es el 16 de octubre de 2026. La fase 1 saca de n8n todo lo imprescindible para recibir reservas.

## What Changes

- **Nuevo `src/lib/mailer.ts`**: envío de correos con la API de Resend (`RESEND_API_KEY`), remitente `EMAIL_FROM` (por defecto `HappyHub <hola@happyhub.es>`), avisos al admin en `ADMIN_EMAILS`.
- **Nuevo `src/lib/emailTemplates.ts`**: plantillas HTML de confirmación al cliente, aviso al admin, recuperar contraseña y cancelación/rechazo (adaptadas de las plantillas de n8n, con los datos del usuario escapados).
- **Nuevo `src/lib/googleCalendar.ts`**: crear y borrar eventos con la cuenta de servicio que ya se usa en `block-dates` (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`). Es opcional: si no está configurado, se omite.
- **`POST /api/webhook-reserva`** deja de llamar a n8n:
  1. Comprueba la disponibilidad y guarda la reserva en Neon en una sola sentencia parametrizada (`INSERT … WHERE NOT EXISTS`). Si la franja está ocupada → 409.
  2. Crea el evento en Google Calendar (si está configurado) y guarda su id.
  3. Envía el correo al cliente y al admin, y el WhatsApp al admin.
  4. Responde `{ success, reservationId, emailWarning? }`, con el mismo formato que antes.
- **Verificación de email e invitaciones** (`lib/email.ts`): Resend primero; n8n solo como respaldo si no hay `RESEND_API_KEY`.
- **Recuperar contraseña** (`/api/auth/reset-password`): correo con Resend.
- **Cancelar/rechazar** (`/api/admin/reservations/[id]/status`): correo al cliente con Resend y borrado del evento de Calendar.

## Fuera de alcance (fase 2)

- Avisos de pago de Stripe (`stripe-webhook`) que hoy van a n8n.
- Recordatorios de pago diarios (Vercel Cron).
- Copia de seguridad de la BD (Neon ya permite restaurar a un punto anterior).
- Apagar n8n y borrar `n8n/`.

## Capabilities

### New Capabilities
- `transactional-email`: envío de correos de la plataforma con Resend.

### Modified Capabilities
- `reservation-request`: la solicitud de reserva se procesa entera en la web, sin n8n.

## Impact

- Nuevas variables: `RESEND_API_KEY` (obligatoria), `EMAIL_FROM`, `ADMIN_EMAILS` (opcionales). `GOOGLE_CALENDAR_ID` (opcional, ya existe en otros endpoints).
- `N8N_WEBHOOK_URL` deja de ser necesaria para crear reservas.
- Requiere tener el dominio `happyhub.es` verificado en Resend (registros DNS en Route 53).
