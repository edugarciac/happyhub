## Decisions

1. **Traducir el código a id en la aplicación**, en lugar de añadir una columna `reservation_id`: el código ya contiene el id (`RES-YYYYMMDD-NNN`), así que no hace falta migración.
2. **Una sola función compartida** (`parseReservationCode`) para cancelación y webhook, con tests. Solo acepta `RES-YYYYMMDD-NNN` o dígitos, y descarta cualquier otra entrada.
3. **Log `CRITICAL` explícito** si un pago llega con un código desconocido (p. ej. el antiguo `RES-<timestamp>` de cuando n8n no devolvía id), con importe y sesión.

## Risks / Trade-offs

- `cancel-pending` sigue sin autenticación (como antes): cualquiera que conozca el código podría cancelar una reserva **pendiente de pago**. Mitigarlo exige verificar la sesión de Stripe; queda como mejora.
