## Decisions

- **Selección**: reservas `confirmed`, `day_before_reminder_sent_at IS NULL`, `event_date` entre hoy y mañana (hora de Madrid) y con algo pendiente: resto sin pagar o fianza sin bloquear (`security_deposit_status` distinto de `held`/`captured`/`released`). Un `UPDATE … RETURNING` atómico marca la columna: un solo aviso por reserva.
- **Columna nueva** (`day_before_reminder_sent_at`) en vez de reutilizar `remaining_reminder_sent_at`: las reservas que ya recibieron el aviso de 3 días deben recibir también el del día antes.
- **Enlace**: token `remaining_payment` (resto + fianza en dos pasos, ya existente), caduca al final del día del evento (hora de Madrid). Sin cambios en `/api/payments/remaining`, `/pagar/[token]` ni el webhook.
- **Frecuencia**: dentro de `processUnpaidReservations` (cron diario 07:00 UTC y listado del admin). Con el cron a las 07:00 UTC, el aviso llega la mañana del día antes.
- **Sin email**: se marca igualmente, para no reintentar.
- **Datáfono**: se quita `terminal` de `MANUAL_FULL_PAYMENT_METHODS` y del modal «Cobro del día»; `mark-remaining-paid` exige método (efectivo o transferencia, como excepción). Se mantiene la etiqueta y la lógica de fianza/devoluciones con `terminal` para reservas antiguas.
- **Quitar el recordatorio de 3 días** (código y plantilla). Se mantiene `remaining_advance` en API, página y webhook por los enlaces ya enviados.
