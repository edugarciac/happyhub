## Why

La política de cancelación (Condiciones, apartado 5) dice que con 15 días o más de antelación se devuelve el 100% de lo pagado. Hoy, al cancelar desde el panel, no se devuelve nada: el admin tiene que entrar en Stripe y hacerlo a mano, y es fácil olvidarlo.

## What Changes

- Nueva regla `isFullRefundEligible`: faltan 15 días o más (días naturales, hora de Madrid) entre hoy y la fecha del evento
- Al pulsar "Cancelar" en una reserva con pagos, la ventana muestra lo pagado y una casilla **"Devolver lo pagado al cliente (X €)"**: marcada si faltan ≥15 días, desmarcada si faltan menos; el admin puede cambiarla (fuerza mayor, excepciones)
- Si la casilla está marcada, al cancelar:
  - se devuelve por Stripe todo lo pagado con tarjeta: señal, resto y cobros adicionales (lo que quede por devolver de cada pago)
  - se libera la fianza si está bloqueada en Stripe
  - lo pagado por otras vías (Bizum, datáfono, efectivo, transferencia) no se puede devolver por Stripe: se envía un email a los admins con lo que hay que devolver a mano
  - se guarda `refunded_amount` y `refunded_at` en la reserva
- El email de cancelación al cliente indica cuánto se le devuelve y por qué vía; si la devolución se hace después ("Devolver pagos"), el cliente recibe un email "Devolución de tu reserva"
- Si alguna devolución de Stripe falla, la cancelación se mantiene, el panel muestra un aviso y llega un email a los admins; desde el menú "Más" de la reserva cancelada aparece **"Devolver pagos"** para reintentarlo
- La lista de reservas muestra "Devuelto: X €"

## Capabilities

### New Capabilities

- `reservation-cancellation`: devolución de pagos al cancelar según la política de 15 días

## Impact

- **Backend**: `src/utils/cancellationPolicy.ts` (nuevo), `src/lib/reservationRefunds.ts` (nuevo), `src/pages/api/admin/reservations/[id]/refund.ts` (nuevo, GET previsualización / POST devolver), `src/pages/api/admin/reservations/[id]/status.ts`, `src/lib/emailTemplates.ts`, `src/lib/reservationFlow.ts` (columnas), `src/pages/api/admin/reservations.ts` (campo `refundedAmount`)
- **Frontend**: ventana de cancelación y menú "Más" en `src/pages/admin/reservations/index.tsx`
- **BD**: columnas `refunded_amount DECIMAL(10,2)`, `refunded_at TIMESTAMPTZ` en `reservations` (idempotente, en `ensureReservationFlowColumns`)
- Fuera de alcance: la cancelación desde "Mi reserva" del cliente (el botón no está implementado)
