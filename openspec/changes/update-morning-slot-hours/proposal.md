## Why

La franja de mañana pasa de 11:00-14:30 (con apertura anticipada gratuita opcional a las 10:00h) a un horario oficial de 10:00-14:00. Hay que reflejar el nuevo horario de forma consistente en toda la plataforma: precios en la home, disponibilidad, flujo de reserva, contratos, WhatsApp, PDF, panel de administración y creación de eventos de calendario.

## What Changes

- Actualizar `TIME_SLOTS` en `src/utils/pricing.ts`: `startTime` pasa de `11:00` a `10:00`, `endTime` de `14:30` a `14:00`; se elimina `earlyOpenTime`/mención de apertura anticipada para la franja de mañana (el nuevo horario ya la incorpora)
- Actualizar todas las etiquetas visibles "Mañana (11:00-14:30)" → "Mañana (10:00-14:00)" en: `PricingTable`, `FullCalendar`, `ReservationForm`, `Step4Confirmation`, páginas de disponibilidad, cómo funciona, pago, éxito de reserva, y panel de administración (listado de reservas, aprobación, creación, fechas bloqueadas, contrato)
- Actualizar la hora usada para crear la reserva/evento de calendario en `Step3CustomerData.tsx` (mapeo `morning` de `11:00` a `10:00`)
- Actualizar el bloqueo de fechas por franja en `src/pages/api/admin/block-dates.ts` (`end` de `14:30` a `14:00`, ya usaba `10:00` como inicio — quedaba inconsistente con `pricing.ts` antes de este cambio)
- Actualizar comentario/lógica descriptiva en `src/pages/api/google-calendar-slots.ts`

## Capabilities

### Modified Capabilities

- `pricing-time-slots`: La franja de mañana pasa a ser 10:00-14:00 en todo el sistema (precios, disponibilidad, reservas, documentos, panel admin)

## Impact

- **Frontend**: componentes y páginas listadas arriba — solo strings de horario y el mapeo de hora de inicio en el flujo de reserva
- **Backend/API**: `block-dates.ts` (bloqueo de franjas), `google-calendar-slots.ts` (clasificación de eventos, sin cambio funcional real ya que el rango horario `>= 10 && < 15` ya cubría 10:00-14:00)
- No hay cambios en el esquema de base de datos ni en los precios (importes) por franja, solo en los horarios de inicio/fin mostrados y usados
