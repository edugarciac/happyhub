## Why

Google Calendar events created by the n8n reservation flow show "(sin titulo)" instead of the expected "Evento: [tipo de evento]". This makes the calendar unusable for quickly identifying reservations at a glance.

## What Changes

- Fix the `summary` parameter in the Google Calendar node so the event title is correctly set to "Evento: [tipo de evento]"
- Ensure the n8n node parameter structure matches what the installed n8n version expects

## Capabilities

### New Capabilities

- `calendar-event-title`: Ensure Google Calendar events created by the reservation flow have the correct title format "Evento: [tipo de evento]"

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **n8n flow**: `n8n-nodes/n8n-reserva-neon-whatsapp.json` — CrearEventoCalendar node parameters
- **Google Calendar**: Events for `hola@happyhub.es` calendar
- No frontend or DB changes needed
