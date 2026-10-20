## Why

El enlace de pago de la señal solo se envía al aprobar la reserva. Si el cliente de la reserva estaba mal (p. ej. email equivocado) y el admin lo corrige, no hay forma de enviar el enlace al cliente correcto, y el plazo de pago sigue corriendo hasta que la reserva se cancela sola.

## What Changes

- Nueva acción en el menú "Más" (Comunicación) para reservas aprobadas sin señal: **"Reenviar enlace de pago de la señal"**
- `POST /api/admin/reservations/[id]/resend-deposit-link`:
  - abre un plazo nuevo de `PAYMENT_WINDOW_HOURS` (24 h) y reinicia el recordatorio
  - anula los enlaces de señal anteriores (pudieron llegar a otra persona)
  - crea un enlace nuevo y envía el email de aprobación con el enlace (o las instrucciones de Bizum) al cliente actual de la reserva
- Ventana con el enlace, botón de copiar y botón "Enviar por WhatsApp" con el mensaje ya escrito

## Capabilities

### Modified Capabilities

- `admin-reservations`: reenvío del enlace de pago de la señal

## Impact

- **Backend**: nuevo `src/pages/api/admin/reservations/[id]/resend-deposit-link.ts`
- **Frontend**: `src/pages/admin/reservations/index.tsx`
