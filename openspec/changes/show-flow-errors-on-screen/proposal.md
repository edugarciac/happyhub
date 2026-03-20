## Why

When the n8n reservation flow fails (DB error, Calendar API error, email failure), the user sees a generic error or no feedback at all. Errors need to propagate back to the frontend so the user knows what went wrong and can retry or contact support.

## What Changes

- n8n flow nodes that can fail (Neon DB, Google Calendar, Gmail) SHALL return meaningful error messages to the webhook response
- The frontend reservation form SHALL display error details to the user when the flow returns an error
- Error responses SHALL include the failing step and a user-friendly message

## Capabilities

### New Capabilities

- `flow-error-propagation`: Ensure n8n flow errors are captured and returned via the webhook response with step identification and user-friendly messages
- `frontend-error-display`: Display n8n flow error details in the reservation form UI

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **n8n flow**: `n8n-nodes/n8n-reserva-neon-whatsapp.json` — add error handling branches for DB, Calendar, and Email nodes
- **Frontend**: Reservation form component — display error messages from API response
- **API route**: `/api/webhook-reserva.ts` — pass through error details from n8n
