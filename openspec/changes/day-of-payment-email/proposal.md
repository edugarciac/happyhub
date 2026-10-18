## Why

En «Cobro del día» el admin puede enseñar el QR o registrar el cobro por datáfono, pero no puede enviar el enlace por correo al cliente (por ejemplo, si el cliente no está delante o prefiere pagar desde su móvil con calma).

## What Changes

- Nuevo botón «Enviar por email» en «Cobro del día»: genera el enlace del día (resto + fianza) y lo envía al email de la reserva con la plantilla de los correos de reserva.
- Las tres opciones del día del evento quedan juntas: enseñar el QR, enviar el correo o registrar el pago en el datáfono (resto y fianza, que ya existían).
- Si el resto ya está pagado (p. ej. con el recordatorio de 3 días antes), el correo solo pide bloquear la fianza.
- El enlace generado por el admin usa por defecto el dominio de producción (antes `localhost` si faltaba `NEXTAUTH_URL`).

## Impact

- `src/pages/api/admin/reservations/[id]/payment-link.ts` (opción `sendEmail`)
- `src/lib/emailTemplates.ts` (`dayOfPaymentEmail`)
- `src/components/admin/DayOfPaymentModal.tsx`
