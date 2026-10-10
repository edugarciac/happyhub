## Context

Hoy el flujo es: web → `webhook-reserva` → n8n (comprobar disponibilidad → INSERT → Google Calendar → Gmail cliente + admin) → respuesta. El webhook de n8n en producción responde nada más empezar, así que la web no se entera de los fallos posteriores.

## Decisions

1. **Resend por API REST (`fetch`)**, sin SDK: no hace falta añadir dependencias y es una sola llamada `POST https://api.resend.com/emails`.
2. **Disponibilidad + INSERT atómicos**: `INSERT … SELECT … WHERE NOT EXISTS (reserva activa en esa fecha y franja) RETURNING id`. Si no devuelve fila → 409. Así dos clientes a la vez no pueden coger la misma franja (n8n hacía dos consultas separadas).
3. **Consultas parametrizadas** (`$1, $2…`): eliminan la inyección SQL del workflow de n8n.
4. **Mismo formato de respuesta** (`success`, `reservationId` `RES-YYYYMMDD-NNN`, `emailWarning`, 409 en conflicto): `Step3CustomerData` no cambia.
5. **Efectos secundarios no bloqueantes pero esperados**: Calendar, correos y WhatsApp se ejecutan con `await` (Vercel congela la función al responder), y un fallo en cualquiera de ellos no anula la reserva. Si falla el correo al cliente → `emailWarning`.
6. **Escapado HTML** de todos los datos del usuario en las plantillas.
7. **n8n como respaldo solo en verificación/invitaciones** mientras se configura Resend; la reserva ya no usa n8n.
8. **`lib/googleCalendar.ts`** reutiliza el patrón de cuenta de servicio de `block-dates.ts` (no caduca, a diferencia del OAuth de n8n).

## Risks / Trade-offs

- **Dominio no verificado en Resend** → Resend solo entrega al email del dueño de la cuenta. Hay que verificar `happyhub.es` antes de abrir al público.
- **Calendar**: la cuenta de servicio necesita permiso de edición sobre el calendario (`GOOGLE_CALENDAR_ID`). Si no lo tiene, la reserva se guarda igual y se registra el error.
- La respuesta tarda un poco más (correos + calendario + WhatsApp en serie, unos 1–3 s).
