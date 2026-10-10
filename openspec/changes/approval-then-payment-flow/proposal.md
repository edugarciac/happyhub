## Why

Hoy, si el cliente elige tarjeta, la web le manda a Stripe a pagar la señal en cuanto envía la solicitud, **antes de que HappyHub la revise**. El propietario quiere revisar y aprobar cada reserva primero y, solo entonces, pedir el pago.

Decisiones del propietario (2026-10-10):
- Métodos de pago: **tarjeta** y **Bizum**. **Se elimina el efectivo** de la web.
- Bizum al **624 645 517**, con el código de la reserva como concepto. El admin marca el pago a mano al recibirlo.
- Plazo para pagar la señal: **24 horas** desde la aprobación.
- Si no se paga en plazo: **cancelación automática**, se libera la franja y se avisa al cliente.

## What Changes

1. **Solicitud** (cliente): siempre queda `pending` (pendiente de aprobación). No hay redirección a Stripe. Se guarda el método elegido (`payment_method`: `card` | `bizum`). Se quita la opción efectivo.
2. **Pantalla final y correo de solicitud**: explican el estado según el método. "Pendiente de aprobación; cuando la aprobemos recibirás un correo para pagar la señal de X € con tarjeta / por Bizum; tendrás 24 h".
3. **Aprobación** (admin, botón Aprobar): fija `payment_due_at = ahora + 24 h`, crea un enlace de pago (`payment_tokens`, tipo `deposit`, caduca en el plazo) y envía el **correo de aprobación**:
   - Tarjeta: botón "Pagar la señal" → `/pagar/[token]` → Stripe.
   - Bizum: instrucciones (importe, 624 645 517, concepto `RES-…`) y el mismo enlace por si prefiere tarjeta.
4. **Página `/pagar/[token]`**: admite la señal (además del pago restante). Muestra importe, plazo, botón de tarjeta e instrucciones de Bizum.
5. **Pago con tarjeta**: el webhook de Stripe marca `deposit_paid` y el enlace como usado.
6. **Bizum**: nuevo botón "Señal recibida (Bizum)" en el panel admin → marca `deposit_paid`.
7. **Caducidad**: las reservas `approved` sin señal pagada con `payment_due_at` vencido pasan a `cancelled` ("Plazo de pago vencido"). Se borra el evento de Calendar y se avisa por correo. Se ejecuta al cargar el calendario de disponibilidad, al crear una reserva y en un cron diario de Vercel (respaldo).

## Capabilities

### Modified Capabilities
- `reservation-approval-payment`: aprobación previa al pago, pago de señal por enlace (tarjeta/Bizum), caducidad a las 24 h.

## Impact

- **BD**: nuevas columnas `reservations.payment_method`, `reservations.payment_due_at` (migración `023`, también aplicada de forma idempotente desde el código).
- **Frontend**: `Step3CustomerData`, `Step4Confirmation`, `pagar/[token]`, panel de reservas.
- **API**: `webhook-reserva`, `admin/reservations/[id]/status`, nuevo `admin/reservations/[id]/mark-deposit-paid`, `payments/remaining` (generalizado a señal), `stripe-webhook`, `booked-slots`, nuevo `cron/expire-reservations`.
- **Vercel**: cron diario + `CRON_SECRET` (opcional pero recomendado).
