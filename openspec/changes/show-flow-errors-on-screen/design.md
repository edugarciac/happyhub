## Context

The current n8n flow uses `continueOnFail: true` on email nodes but has no error handling for DB or Calendar failures. When these steps fail, the flow either hangs or returns an uninformative error. The frontend currently shows a generic "Error" message.

## Goals / Non-Goals

**Goals:**
- Every failure in the n8n flow returns a structured JSON error response with the failing step name
- The frontend displays the error message from the API response
- Users can understand what went wrong (e.g., "Error al guardar en base de datos", "Error al crear evento en calendario")

**Non-Goals:**
- Automatic retry logic
- Admin notification on errors (already handled separately)
- Logging/monitoring infrastructure

## Decisions

1. **Error response format**: Standardize on `{ success: false, error: string, step: string, code: number }` for all error responses from n8n
2. **Error handling approach**: Use n8n's `onError: "continueErrorOutput"` on critical nodes (DB, Calendar) to route errors to a shared error response node
3. **User-facing messages**: Use Spanish, non-technical messages. Map internal errors to friendly text in the PrepararRespuesta or a new error handler function node.

## Risks / Trade-offs

- [Risk] n8n error output format varies by node type → Handle generically by checking for error property in output
- [Risk] Exposing internal error details to users → Only show friendly messages, log technical details in n8n executions
