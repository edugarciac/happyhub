## 1. Backend
- [x] 1.1 Migración 031 + columna `extras` en `ensureReservationFlowColumns`
- [x] 1.2 `src/lib/reservationExtras.ts` (resolver ids contra catálogo, conservar los guardados)
- [x] 1.3 POST admin: validar y guardar `extraHours` y `extras`
- [x] 1.4 PATCH admin: validar y guardar; actualizar evento de Calendar
- [x] 1.5 `webhook-reserva`: guardar `extras`
- [x] 1.6 `updateReservationEventTimes` en `googleCalendar.ts`; servicios en la descripción del evento manual

## 2. Admin UI
- [x] 2.1 Componente `ReservationExtrasFields`
- [x] 2.2 Reserva manual: horas + servicios, ajuste de total y señal
- [x] 2.3 Modal de edición: horas + servicios, ajuste de total
- [x] 2.4 Listado: mostrar servicios

## 3. Verify
- [x] 3.1 Tests de `reservationExtras`
- [x] 3.2 Typecheck y tests pasan
