## Why

Tras pagar la señal (tarjeta o Bizum), la reserva seguía en estado "Aprobada", solo con una etiqueta de "Señal pagada". No se distinguía bien una reserva aprobada pendiente de pago de una ya pagada.

## What Changes

- Nuevo estado **`confirmed` (Confirmada)**. Flujo: Pendiente → Aprobada (pendiente de pago) → **Confirmada** → Realizada. Cancelable antes de "Realizada".
- La reserva pasa a Confirmada **automáticamente** al pagar la señal: webhook de Stripe (si estaba `approved`) o botón "Señal recibida (Bizum)". No se elige a mano en el desplegable.
- "Realizada" solo es posible desde Confirmada.
- Las reservas `approved` ya pagadas se pasan a `confirmed` (idempotente, en `ensureReservationFlowColumns`).
- Etiquetas y colores: "Aprobada (pendiente de pago)" en ámbar, "Confirmada" en verde, en el panel de reservas, la ficha de clientes y el área privada del cliente. Filtro "Confirmada" en el panel.
- Caso límite: si llega un pago de Stripe para una reserva que ya no está aprobada (p. ej. cancelada por plazo vencido), se registra el pago y se **avisa al admin por correo** para reactivarla o devolver el dinero.

## Impact

- `utils/reservationStatus.ts`, `stripe-webhook`, `mark-deposit-paid`, `lib/reservationFlow.ts`, panel de reservas, clientes, área privada, tests.
- `booked-slots` y `webhook-reserva` ya contaban `confirmed` como franja ocupada.
