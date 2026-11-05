## Decisions

- **Quitar, no desactivar con flag**: la decisión del propietario es cobrar el día del evento; se elimina el código del recordatorio para no dejar caminos muertos.
- **Compatibilidad**: se mantiene `remaining_advance` en `/api/payments/remaining`, `/pagar/[token]` y el webhook, porque puede haber enlaces enviados aún válidos. Se podrá retirar cuando hayan caducado todos.
- **BD**: no se borra `remaining_reminder_sent_at` (evita una migración destructiva; no molesta).
