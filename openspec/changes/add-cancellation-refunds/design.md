## Context

Pagos posibles de una reserva:
- Señal: Stripe Checkout (`stripe_deposit_session_id`) o marcada a mano (Bizum u otra vía)
- Resto: Stripe Checkout (`remaining_payment_method = 'card_link'`, `stripe_remaining_session_id`) o a mano (datáfono, efectivo, transferencia)
- Cobros adicionales: `reservation_charges` con `status = 'paid'`, `paid_method = 'card'` y `stripe_session_id`, o a mano
- Fianza: preautorización en Stripe (`security_deposit_status = 'held'`, `card_link`) o en datáfono

`stripe_deposit_session_id` se guarda al **crear** el enlace, así que no prueba que se pagara: se consulta la sesión en Stripe y solo cuenta si `payment_status = 'paid'`.

## Decisions

- **Plan de devolución calculado en el servidor** (`getRefundPlan`) y usado tanto por la previsualización como por la ejecución, para que lo que ve el admin sea lo que se devuelve.
- **Importe por pago = cobrado − ya devuelto** (`latest_charge.amount_refunded`), así un reintento o una devolución parcial previa hecha en Stripe no provoca doble devolución. Además `idempotencyKey` por PaymentIntent e importe.
- **La cancelación no se bloquea si falla Stripe**: el estado cambia, se avisa al admin y se puede reintentar con "Devolver pagos" (POST solo permitido en reservas canceladas).
- **Días hasta el evento** en días naturales de Europe/Madrid (fecha del evento − hoy), igual que el aviso que ve el cliente en "Mi reserva".

## Risks / Trade-offs

- Llamadas a Stripe al abrir la ventana de cancelación (1–3 consultas): latencia aceptable para una acción puntual.
- Pagos con tarjeta no registrados por el fallo del webhook del 18/10 no aparecen en el plan hasta reenviar su evento desde Stripe.
