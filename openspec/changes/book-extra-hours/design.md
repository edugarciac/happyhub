## Decisions

- **Fuente única**: `EXTRA_HOUR_PRICE` (60) y `MAX_EXTRA_HOURS` (3) en `src/utils/pricing.ts`, con helpers `extraHoursPrice(n)` y `slotEndTime(slot, n)` usados por cliente y servidor.
- **Solo tarde**: el reducer pone `extraHours` a 0 al cambiar de franja; el servidor rechaza (400) horas fuera de 0–3 o en una franja que no sea tarde.
- **Descuento**: no se aplica a las horas adicionales (precio fijo por hora).
- **Señal**: 30% del total, horas incluidas (se mantiene la regla actual).
- **Precio**: el servidor sigue confiando en el total enviado por el cliente (modelo actual); las horas sí se recalculan en servidor para el calendario y los emails.
- **Disponibilidad**: no cambia; la noche ya no se reserva, así que la ampliación hasta las 23:00 no choca con otra franja.

## Risks

- Reservas antiguas sin columna: `DEFAULT 0` las cubre.
