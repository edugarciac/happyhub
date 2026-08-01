# Design: shared API utilities

## New file: `src/lib/apiMiddleware.ts`

### `withCollaborativeEventAuth(handler)`
Higher-order function wrapping a Next.js API handler. Validates next-auth session, parses `req.query.id` as eventId, loads collaborative event and participant, checks access (participant or organizer). Passes resolved `CollaborativeEventContext` to the inner handler.

### `withAdminHandler(handler, logLabel)`
Higher-order function wrapping a Next.js API handler. Calls `requireAdminSession`, catches `Unauthorized` errors (401), logs and returns 500 for other errors.

### `parseIntParam(value)`
Returns `number | null`. Safely parses `string | string[] | undefined` query params.

### `methodNotAllowed(res)`
Returns `res.status(405).json(...)`.

### `buildDynamicUpdate(fields, startIndex)`
Builds parameterized SET clauses from an object. Skips `undefined` values. Returns `{ setClauses, params, nextIndex }` or `null` if empty.

### `notifyN8n(path, payload)`
Fire-and-forget POST to `N8N_WEBHOOK_URL + path`. Dynamically imports axios. Catches and logs errors silently.

## Refactored routes
- ~20 collaborative event routes under `src/pages/api/events/collaborative/[id]/`
- ~10 admin routes under `src/pages/api/admin/`
- `area-privada.tsx` (removed duplicate `formatCurrency`)
