## Why

Desde el cambio `stripe-webhook-idempotency` (2026-10-18) ningún pago con tarjeta de señal o resto se registra. `/api/payments/remaining` guarda `stripe_deposit_session_id` / `stripe_remaining_session_id` al **crear** la sesión de Checkout, y el webhook considera "evento repetido" cualquier sesión cuyo id ya esté en la reserva. Resultado: el primer y único `checkout.session.completed` se ignora y la reserva sigue "Pendiente de señal". Confirmado en los logs de producción del 2026-10-19 (consulta de idempotencia con `rows: 1` y ninguna actualización posterior).

## What Changes

- La comprobación de evento repetido exige que el id de sesión coincida **y** que el pago conste como pagado (`deposit_paid`/`fully_paid` para la señal, `fully_paid` para el resto)
- Se mantiene el guardado del id de sesión al crear el enlace

## Capabilities

### Modified Capabilities

- `stripe-webhook`: la idempotencia no bloquea el primer evento de pago

## Impact

- **Backend**: `src/pages/api/stripe-webhook.ts`
- **Datos**: los pagos con tarjeta desde el 2026-10-18 no registrados deben recuperarse reenviando el evento desde Stripe (Desarrolladores → Eventos → Reenviar) o marcándolos a mano
