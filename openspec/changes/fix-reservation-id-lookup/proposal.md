## Why

Al cancelar el pago en Stripe, la reserva seguía ocupando la franja del calendario. Los logs de Vercel (2026-10-10 18:08 UTC) muestran:

`cancel-pending error: column "reservation_id" does not exist`

`/api/reservations/cancel-pending` buscaba `WHERE id = $1 OR reservation_id = $1`, pero la tabla `reservations` de producción no tiene la columna `reservation_id`. Lo que llega es el código visible `RES-YYYYMMDD-NNN`. La consulta fallaba siempre y la reserva quedaba `pending`.

El **webhook de Stripe** (`checkout.session.completed`) tenía el mismo fallo (`WHERE reservation_id = $3 OR id::text = $3`): **los pagos de señal y restantes no se registraban en la BD** (`payment_status`, `deposit_paid`), solo un log `CRITICAL`.

## What Changes

- Nuevo `src/utils/reservationCode.ts`: `buildReservationCode` (movido desde `emailTemplates`) y `parseReservationCode`, que traduce `RES-YYYYMMDD-NNN` (o un id numérico de los enlaces de pago del admin) al `id` real.
- `cancel-pending`: busca por `id` con el código traducido. Libera la franja (status `cancelled`) y borra el evento de Calendar.
- `stripe-webhook`: actualiza `payment_status` / `deposit_paid` por `id`. Si el código no se reconoce, registra un log `CRITICAL` con la sesión de Stripe para conciliarlo a mano.

## Impact

- `src/pages/api/reservations/cancel-pending.ts`, `src/pages/api/stripe-webhook.ts`, `src/lib/emailTemplates.ts`
- Pagos ya hechos antes de este cambio: revisar en Stripe y marcar a mano en el panel.
