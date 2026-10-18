## Why

Las reservas creadas a mano desde el panel admin (`POST /api/admin/reservations`) solo se insertan en la BD: el cliente no recibe el correo de "Solicitud de reserva" ni se crea el evento en Google Calendar, a diferencia de la reserva web. Los clientes de las reservas manuales #43 y #44 no se han enterado de su reserva.

## What Changes

- La reserva manual envía al cliente el mismo correo de solicitud que la reserva web (`reservationCustomerEmail`) y crea el evento `[PENDIENTE]` en Google Calendar.
- Nuevo endpoint `POST /api/admin/reservations/[id]/resend-confirmation` y botón "Reenviar correo de la reserva" en el panel (reservas pendientes) para reenviar el correo, p. ej. a #43 y #44.
- El admin ve un aviso si el correo no se pudo enviar.
- No se envía al propio admin el correo/WhatsApp de "Nueva reserva - Requiere revisión": la ha creado él.

## Capabilities

### New Capabilities

- `manual-reservation-notifications`: notificación al cliente de reservas creadas por el admin

## Impact

- `src/lib/reservationNotifications.ts` (nuevo), `src/pages/api/admin/reservations.ts`, `src/pages/api/admin/reservations/[id]/resend-confirmation.ts` (nuevo), `src/pages/admin/reservations/index.tsx`, `src/pages/admin/reservations/create.tsx`
