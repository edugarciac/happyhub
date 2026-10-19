## Why

Cuando Stripe confirma un pago (`checkout.session.completed`) que el webhook no consigue asociar a una reserva, hoy solo se escribe un `console.error`. En el plan Hobby de Vercel los logs se conservan 1 hora, así que el admin nunca se entera: el cliente ha pagado y la reserva sigue "Pendiente de señal".

## What Changes

- La reserva se identifica siempre por los metadatos del pago: `metadata.reservationId` (lo que envían todos los flujos de la web) y, como alternativa, `metadata.reservation_id` (pagos creados a mano desde el panel de Stripe). El id de sesión solo se usa para ignorar eventos repetidos (sin cambios)
- Email de alerta a los admins (`ADMIN_EMAILS`) cuando un pago completado:
  - no trae id de reserva en los metadatos
  - trae un código de reserva no reconocible
  - apunta a una reserva que no existe en la base de datos
  - no se puede registrar por un error de base de datos (señal, resto o fianza)
  - es un cobro adicional cuyo cobro no existe o falla al registrarse
- En los casos sin reserva ya no se envían los WhatsApp de "nueva reserva" (antes se enviaban igualmente)

## Capabilities

### Modified Capabilities

- `stripe-webhook`: alerta por email de pagos sin reserva asociada

## Impact

- **Backend**: `src/pages/api/stripe-webhook.ts`, nueva plantilla `unmatchedPaymentAlertEmail` en `src/lib/emailTemplates.ts`
- Sin cambios de base de datos ni en la creación de sesiones de pago
