## Decisions

- Comprobación previa por id de sesión de Stripe (`SELECT 1 … WHERE <columna> = session.id`) y salida temprana, antes de actualizar la reserva y de enviar correos o WhatsApp. El id de sesión es único por pago, así que no bloquea pagos distintos de la misma reserva.
