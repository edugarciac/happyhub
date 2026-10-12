## Context

El precio total y la señal se calculan en el cliente (`BookingContext`) y se envían a `/api/webhook-reserva`, que los guarda tal cual en `reservations`. Las fechas de apertura viven en `src/config/opening.ts`.

## Goals / Non-Goals

**Goals:**
- Aplicar el 10% al alquiler de forma automática y visible durante el periodo de promoción.
- Que la promoción se apague sola tras el 18/10 sin desplegar nada.

**Non-Goals:**
- Sistema genérico de cupones/códigos promocionales.
- Recalcular automáticamente las solicitudes existentes.
- Recalcular en servidor el precio completo (el modelo actual confía en el cliente; fuera de alcance).

## Decisions

1. **Config en código** (`src/config/promotions.ts`): `percent: 10`, `requestedUntil: OPENING_DATE`, `eventUntil: '2026-12-30'`. Es una promoción puntual; no merece tabla ni panel de admin.
2. **Fecha de solicitud en hora de Madrid** (`todayInMadrid`), inclusive.
3. **Solo sobre el alquiler**: `discount = round(basePrice × 10%, 2)`; `total = base − discount + extras`; la señal sigue siendo `ceil(total × 30%)`.
4. **Validación en servidor**: el cliente envía `discountAmount`; si es > 0 y el servidor (con su hora) no considera la solicitud elegible, responde 400 pidiendo recargar. Evita que una pestaña abierta desde antes del corte cuele el descuento.
5. **Existentes a mano**: el desglose de extras no se guarda, así que se listan con SQL y se ajustan en `/admin/reservations`.

## Risks / Trade-offs

- [Riesgo] Fechas "A consultar" (festivos/vísperas) no tienen precio → el descuento se aplica a mano al presupuestar.
