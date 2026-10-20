## Context

Sincronizar por API exige mantener el estado en dos sitios (crear/mover/borrar en cada cambio) y una cuenta de servicio. Un feed .ics se genera desde la BD en cada lectura: no hay nada que sincronizar ni que se pueda desincronizar.

## Decisions

- **Feed de solo lectura generado al vuelo**: la BD es la única fuente de verdad. Contrapartida: Google Calendar refresca los calendarios suscritos cada varias horas (no configurable); Apple permite cada 15 min.
- **Token = HMAC-SHA256(NEXTAUTH_SECRET, "happyhub-calendar-feed")** (32 hex): sin variables nuevas; se rota cambiando `CALENDAR_FEED_SECRET` (opcional, tiene prioridad). Comparación en tiempo constante. El feed contiene datos personales de clientes, por eso no es público.
- **Horarios con TZID=Europe/Madrid** y `VTIMEZONE` incluido; la franja de noche termina al día siguiente; las horas extra amplían el fin (`slotEndTime`).
- **UID estable** (`reservation-<id>@happyhub.es`, `blocked-<id>@happyhub.es`) para que los clientes de calendario actualicen en vez de duplicar.
- Generación del texto iCalendar en una función pura (`src/utils/icalendar.ts`) con escape y plegado de líneas a 75 octetos, testeada.

## Risks / Trade-offs

- Retraso de Google en refrescar → para ver cambios al momento, usar el panel o el calendario de Apple.
- Quien tenga el enlace ve las reservas: no compartirlo; para revocarlo, definir `CALENDAR_FEED_SECRET`.
