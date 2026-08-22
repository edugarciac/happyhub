## Why

La franja de tarde pasa de 16:30-20:30 (con apertura anticipada gratuita opcional a las 15:30h) a un horario oficial de 16:00-20:00. Hay que reflejar el nuevo horario de forma consistente en toda la plataforma: precios en la home, disponibilidad, flujo de reserva, contratos, WhatsApp, PDF, panel de administración y creación de eventos de calendario.

## What Changes

- Actualizar `TIME_SLOTS` en `src/utils/pricing.ts`: `startTime` pasa de `16:30` a `16:00`, `endTime` de `20:30` a `20:00`; se elimina `earlyOpenTime`/mención de apertura anticipada para la franja de tarde (el nuevo horario ya la incorpora)
- Actualizar todas las etiquetas visibles "Tarde (16:30-20:30)" → "Tarde (16:00-20:00)" en: `PricingTable`, `FullCalendar`, `ReservationForm`, `Step4Confirmation`, páginas de disponibilidad, cómo funciona, pago, éxito de reserva, y panel de administración (listado de reservas, aprobación, creación, fechas bloqueadas, contrato)
- Actualizar la hora usada para crear la reserva/evento de calendario en `Step3CustomerData.tsx` (mapeo `afternoon` de `16:30` a `16:00`)
- Actualizar el bloqueo de fechas por franja en `src/pages/api/admin/block-dates.ts` (`afternoon.start` de `15:30` a `16:00`, `end` de `20:30` a `20:00`)
- Actualizar comentario descriptivo en `src/pages/api/google-calendar-slots.ts` (la lógica de clasificación `startHour >= 15 && startHour < 21` ya cubre 16:00-20:00, no requiere cambio funcional)
- Actualizar el texto de "acceso anticipado sin coste" en `disponibilidad.tsx` y `como-funciona.tsx` para que ya no mencione la tarde (solo la noche sigue teniendo apertura anticipada)

## Capabilities

### Modified Capabilities

- `pricing-time-slots`: La franja de tarde pasa a ser 16:00-20:00 en todo el sistema (precios, disponibilidad, reservas, documentos, panel admin)

## Impact

- **Frontend**: componentes y páginas listadas arriba — strings de horario, el mapeo de hora de inicio en el flujo de reserva, y el texto de apertura anticipada
- **Backend/API**: `block-dates.ts` (bloqueo de franjas), `google-calendar-slots.ts` (clasificación de eventos, sin cambio funcional real ya que el rango horario `>= 15 && < 21` ya cubre 16:00-20:00)
- No hay cambios en el esquema de base de datos ni en los precios (importes) por franja, solo en los horarios de inicio/fin mostrados y usados
