## Context

The n8n reservation flow (`n8n-reserva-neon-whatsapp.json`) creates Google Calendar events via the `CrearEventoCalendar` node. The `summary` field (event title) is set but Google Calendar shows "(sin titulo)". The node uses `n8n-nodes-base.googleCalendar` typeVersion 1.

The root cause: the n8n Google Calendar node v1 `create` operation expects `summary` as a top-level parameter in some versions, but in the installed n8n version it may require a different parameter structure or the expression is not being evaluated.

## Goals / Non-Goals

**Goals:**
- Calendar events display "Evento: [tipo de evento]" as the title
- Fix is applied in the n8n flow JSON, no manual n8n UI editing needed

**Non-Goals:**
- Changing the Google Calendar node version
- Modifying event description, location, or other fields
- Adding additional calendar integrations

## Decisions

1. **Test parameter placement**: Try `summary` both as top-level and inside `additionalFields`. The n8n Google Calendar node documentation for v1 create operation suggests it may need to be in `additionalFields` depending on the n8n version.
2. **Verify expression evaluation**: Ensure the expression `=Evento: {{ $json.tipoEvento }}` is correctly evaluated at the node — the `tipoEvento` field must exist in the data flowing into the Calendar node from MergeConDatos.

## Risks / Trade-offs

- [Risk] Parameter structure may differ across n8n patch versions → Test in n8n.happyhub.es after each change
- [Risk] If `tipoEvento` is empty/undefined, title will be "Evento: " → Low risk, field is always set by NormalizarDatos
