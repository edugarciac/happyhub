## Decisions

- **Almacenamiento**: `reservations.extras JSONB NOT NULL DEFAULT '[]'` con `[{id, title, price}]`. Guardar título y precio congela lo contratado aunque el catálogo cambie después. Se crea también en `ensureReservationFlowColumns`.
- **Resolución en servidor** (`src/lib/reservationExtras.ts`): el navegador solo envía `extraIds`. Los ids nuevos se buscan en `service_catalog` activo (id desconocido → 400). Al editar, los servicios ya guardados se conservan tal cual aunque se hayan desactivado o cambiado de precio.
- **Precio**: el admin manda (puede negociar), así que no se recalcula en servidor. En el formulario, cambiar horas/servicios suma o resta la diferencia al total. En la reserva manual la señal se fija al 30% del total; en la edición la señal no se toca (puede estar ya pagada).
- **Franja de mañana**: al pasar a mañana, las horas vuelven a 0 (y se resta su precio). El servidor rechaza horas en mañana con 400.
- **Calendar**: nuevo `updateReservationEventTimes(eventId, date, timeSlot, extraHours)`; el PATCH lo llama si cambia fecha, franja u horas y hay `google_calendar_event_id`. Si falla, la edición se mantiene (solo log).
- **UI compartida**: componente `ReservationExtrasFields` usado en crear y editar (no se define dentro de otro componente; ver `noNestedComponents.test.ts`).

## Risks

- Reservas web anteriores no tienen `extras` (quedan `[]`); sus servicios siguen solo en la prueba de contrato.
