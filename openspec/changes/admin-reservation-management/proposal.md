## Why

The admin panel currently lists reservations by reading Stripe checkout sessions, not from the database. This means admins can only view reservations passively - they cannot change status, edit details, delete entries, or quickly contact customers. As HappyHub grows, the admin needs full CRUD control over reservations from a single interface, plus one-click communication channels (WhatsApp, email) to reduce response time and manual effort.

## What Changes

- Rewrite the admin reservations list to read from the PostgreSQL database (reservations + users tables) instead of Stripe sessions
- Add status management: transition reservations between `pending`, `approved`, `rejected`, `cancelled`, and `completed`
- Add inline editing of reservation details: event date, time slot, guests, event type, notes, prices
- Add reservation deletion with confirmation dialog
- Add one-click WhatsApp deep link (`wa.me`) per reservation row using the customer's phone number
- Add one-click mailto link per reservation row using the customer's email
- Add a reservation detail/edit view accessible from the list

## Capabilities

### New Capabilities
- `reservation-crud`: Full create, read, update, delete operations for reservations from the admin panel, backed by the PostgreSQL database
- `reservation-status-management`: Status transitions (pending, approved, rejected, cancelled, completed) with validation rules and optional customer notifications
- `reservation-contact-actions`: One-click WhatsApp (wa.me deep link) and email (mailto) actions from the reservation list, using customer phone and email

### Modified Capabilities
<!-- No existing openspec/specs/ to modify -->

## Impact

- **API routes**: New/updated endpoints under `/api/admin/reservations/` for PATCH (update/status), DELETE, and updated GET (from DB instead of Stripe)
- **Frontend pages**: `src/pages/admin/reservations/index.tsx` rewritten to use DB-backed API; new edit modal or detail page
- **Database**: No schema changes needed (reservations table already has all required fields including `status`)
- **Existing integrations**: Stripe data remains the source of truth for payment info; DB is source of truth for reservation lifecycle
- **WhatsApp**: Uses existing `src/lib/whatsapp.ts` utilities for server-side notifications; client-side uses `wa.me` links
