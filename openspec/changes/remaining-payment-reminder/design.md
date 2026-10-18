## Decisions

- **Selección**: reservas `confirmed`, `payment_status <> 'fully_paid'`, `total_price > deposit_paid`, `remaining_reminder_sent_at IS NULL` y `event_date` entre hoy y hoy + 3 días (hora de Madrid). Un `UPDATE … RETURNING` atómico marca `remaining_reminder_sent_at`, así cada reserva se avisa una sola vez.
- **Enlace**: nuevo tipo de `payment_tokens`, `remaining_advance`, válido hasta el final del día del evento (hora de Madrid). Reutiliza la página `/pagar/[token]` y `/api/payments/remaining`, pero solo con el paso «pagar el resto». La API rechaza el paso de fianza con este enlace. Tras pagar, la página confirma el pago y explica que la fianza se bloquea el día del evento. El webhook marca el enlace como usado.
- **Día del evento**: el enlace/QR del admin (`remaining_payment`) sigue igual. Si el resto ya está pagado, solo queda el paso de la fianza.
- **Sin email**: se marca igualmente (no se puede enviar), para no reintentar cada día.
- **Frecuencia**: dentro de `processUnpaidReservations`, que ya ejecutan el cron diario y el listado de admin.
- **Texto**: el correo pide tener el resto abonado antes del evento y ofrece pagarlo ya. Es coherente con los términos («el día del evento, antes de empezar, se paga el resto»), que no cambian.
