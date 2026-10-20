## Why

La integración con Google Calendar (cuenta de servicio que crea, mueve y borra eventos) no está en uso, pero sigue en el código y en los textos ("se eliminará el evento del Google Calendar", política de privacidad), lo que confunde. Además solo creaba el evento como "[PENDIENTE]" y nunca reflejaba si la reserva se aprobaba, se pagaba o cambiaba de estado.

## What Changes

- **Nuevo calendario de suscripción (.ics)**: `GET /api/calendar/<token>.ics` genera en cada petición un calendario con las reservas activas (pendiente, aprobada, confirmada, realizada) desde hace 90 días y las fechas bloqueadas. Siempre refleja la base de datos: estado en el título, cliente, contacto, personas, extras, importes y pago en la descripción
- El enlace lleva un token secreto derivado de `NEXTAUTH_SECRET` (HMAC); sin token válido devuelve 404
- En el panel de reservas, botón **"Calendario"** con el enlace, botón de copiar, enlace `webcal://` para iPhone/iPad e instrucciones para Google Calendar y Apple
- **Se elimina la integración con Google Calendar**: `src/lib/googleCalendar.ts`, `src/pages/api/google-calendar-slots.ts` y todas las llamadas (alta de reserva web y manual, edición, cancelación, caducidad, fechas bloqueadas, cancel-pending)
- Se quita Google Calendar de la política de privacidad y de `CLAUDE.md`; nueva ADR en `docs/project_notes/decisions.md`
- Las columnas `google_calendar_event_id` se mantienen en la BD (sin uso) para no hacer migraciones destructivas

## Capabilities

### New Capabilities

- `calendar-feed`: calendario .ics de suscripción con reservas y bloqueos

### Removed Capabilities

- Sincronización con Google Calendar por API

## Impact

- **Backend**: nuevo `src/utils/icalendar.ts`, `src/lib/calendarFeed.ts`, `src/pages/api/calendar/[file].ts`, `src/pages/api/admin/calendar-feed.ts`; limpieza en `webhook-reserva.ts`, `reservationNotifications.ts`, `reservationFlow.ts`, `admin/reservations/[id]/index.ts`, `admin/reservations/[id]/status.ts`, `admin/block-dates.ts`, `reservations/cancel-pending.ts`
- **Frontend**: botón y ventana "Calendario" en `src/pages/admin/reservations/index.tsx`; `politica-privacidad.tsx`
- **Variables de entorno**: `GOOGLE_CALENDAR_ID` deja de usarse (`GOOGLE_CLIENT_EMAIL`/`GOOGLE_PRIVATE_KEY` siguen si los usa Google Drive)
