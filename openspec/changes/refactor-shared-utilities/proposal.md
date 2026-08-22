# Refactor: Extract shared API utilities

## Problem
20+ collaborative event API routes repeat identical auth/access-check boilerplate (~15 lines each).
15+ admin routes repeat the same try/catch + requireAdminSession wrapper.
Dynamic SQL update builders are copy-pasted across 5+ routes.
n8n webhook notification logic is duplicated in 4+ reservation routes.
`formatCurrency` is defined both in `src/utils/formatters.ts` and inline in `area-privada.tsx`.

## Solution
Extract repeated patterns into `src/lib/apiMiddleware.ts`:

- `withCollaborativeEventAuth(handler)` - wraps handler with session/event/participant validation
- `withAdminHandler(handler, label)` - wraps handler with admin auth + error handling
- `parseIntParam(value)` - safe query param parsing
- `methodNotAllowed(res)` - 405 helper
- `buildDynamicUpdate(fields, startIndex)` - dynamic SQL SET clause builder
- `notifyN8n(path, payload)` - fire-and-forget n8n webhook

Then refactor all affected routes to use these utilities.

## Impact
- No API contract changes
- No database changes
- Pure internal refactoring
