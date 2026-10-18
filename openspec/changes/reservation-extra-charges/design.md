## Decisions

- **Tabla propia** `reservation_charges` (id, reservation_id, concept, hours, description, amount, status `pending|paid|cancelled`, token, expires_at, stripe_session_id, paid_method, created_by, created_at, paid_at). No se usa `payment_tokens`: la página `/pagar/[token]` interpreta esos enlaces como señal o resto.
- **Separado del total**: el cobro no toca `total_price` ni `deposit_paid`, así el resto del día del evento (`total - deposit_paid`) no cambia. Si además se quiere reflejar en la reserva (horas en Calendar, servicios), se edita la reserva.
- **Validación** pura en `src/utils/charges.ts` (concepto, horas 1–3, importe > 0 y ≤ 5.000 €, descripción obligatoria en «otros»), con etiqueta del concepto compartida por correo, página y admin.
- **Caducidad**: el enlace vale hasta el final del día del evento, y como mínimo 72 h.
- **Estados de la reserva**: solo se puede cobrar en reservas `pending`, `approved` o `confirmed`.
- **Stripe**: Checkout con `metadata.type = 'extra_charge'`, `chargeId` y `reservationId` (código). El webhook marca `paid` con un `UPDATE … WHERE status = 'pending'` (idempotente ante reintentos), envía las confirmaciones y no lanza los avisos de WhatsApp de nueva reserva.
- **Correo**: mismo `layout`/`rows`/`note` que el resto de correos de reserva. Si la reserva no tiene email, se crea el cobro igualmente y se avisa al admin para que envíe el enlace a mano.

## Risks

- Un cliente podría pagar un cobro anulado si ya tenía abierta la página de Stripe: el webhook lo registra como pagado y avisa al admin.
