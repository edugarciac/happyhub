## Decisions

- **Sin estado nuevo en BD**: `status` sigue siendo `confirmed` (disponibilidad, recordatorios, cobros y cron dependen de él). El estado visible se deriva de `status` + `payment_status` con `reservationDisplayStatus()`: `confirmed` + `fully_paid` → «Pagado»; `confirmed` con otro pago → «Señal pagada».
- **Transiciones**: `getAvailableTransitions(status, paymentStatus)` solo incluye `completed` si `payment_status = 'fully_paid'`. La API de estado aplica la misma regla (400 si no).
- **Marcar pago total**: reutiliza `mark-remaining-paid` con `method` (`terminal` | `cash` | `transfer`, por defecto `terminal`), para reservas `confirmed` sin pago total. Guarda `remaining_payment_method`.
- **Filtro**: valores `confirmed_deposit` y `confirmed_paid` en la API del listado.
