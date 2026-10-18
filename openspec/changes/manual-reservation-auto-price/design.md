## Decisions

- **Una sola fuente de precio**: el endpoint reutiliza `computeReservationPrice`, así web y admin dan el mismo precio.
- **Solo en la reserva manual**: en la edición se mantiene el ajuste por diferencia, para no pisar precios ya acordados o pagados.
- **Peticiones fuera de orden**: el efecto descarta respuestas de peticiones antiguas (flag `cancelled`), para que gane siempre la última selección.
- **Sobrescritura manual**: no se bloquea; el siguiente cambio de fecha, franja, horas o servicios vuelve a poner el precio calculado.
