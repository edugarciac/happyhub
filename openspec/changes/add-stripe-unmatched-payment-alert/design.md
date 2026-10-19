## Decisions

- **Alerta en el propio webhook** (no en un cron de conciliación): es inmediata y no requiere consultar Stripe periódicamente.
- **`alertUnmatchedPayment` nunca lanza**: un fallo al enviar el email no debe devolver error a Stripe (provocaría reintentos y alertas duplicadas). Si la consulta de existencia de la reserva falla por la BD, sí se devuelve 400 para que Stripe reintente.
- **Destinatarios `getAdminEmails()`**, igual que el resto de avisos internos (p. ej. "señal pagada en reserva cancelada").
