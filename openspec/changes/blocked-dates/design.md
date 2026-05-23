## Context

The booking calendar in HappyHub (`FullCalendar.tsx`) reads availability from `/api/booked-slots`, which queries reservations with status `pending/approved/confirmed`. There is no mechanism to block dates for internal reasons. A stub endpoint at `/api/admin/block-dates.ts` uses a module-level object for storage — data is lost on any cold start or deployment.

The existing Google Calendar integration creates events when reservations are approved (`src/lib/googleCalendar.ts`). The same client can be reused for blocked-slot events.

Admin auth uses JWT session checked via `getServerSession` with `authOptions` from `src/lib/auth.ts`. All new admin API routes follow the same pattern as existing ones under `src/pages/api/admin/`.

## Goals / Non-Goals

**Goals:**
- Persistent blocked slots in PostgreSQL
- CRUD management from admin panel (date range entry, listing, edit reason, delete)
- Public calendar shows blocked = unavailable (indistinguishable from reservation)
- Admin calendar shows blocked with distinct visual (amber/orange)
- Google Calendar sync on create/delete

**Non-Goals:**
- Client-facing explanation of why a date is blocked
- Recurring blocked slots (e.g., "every Monday closed")
- Notifications to clients when a previously-available date gets blocked
- Blocking dates that already have confirmed reservations (handled separately by reservation management)

## Decisions

### 1. Individual slot records (not ranges)

**Decision**: Store one row per `(slot_date, time_slot)` pair in `blocked_slots`.

**Rationale**: Queries are trivial (simple JOIN or UNION with reservations). Individual slot deletion and modification are O(1). Even blocking 2 months × 3 slots = 180 rows, negligible for Postgres. Range metadata (why, who) is duplicated per row but the dataset is tiny and human-managed.

**Alternatives considered**: Storing ranges with expansion on read — rejected because query complexity and date arithmetic on every request outweigh the storage savings.

### 2. Bulk insert with ON CONFLICT DO UPDATE

**Decision**: When creating a range, expand day-by-day × slot and do `INSERT ... ON CONFLICT (slot_date, time_slot) DO UPDATE SET reason = EXCLUDED.reason, updated_at = NOW()`.

**Rationale**: Idempotent — re-blocking an existing slot updates its reason rather than erroring. The UI can re-submit the same range after editing the reason without needing to delete first.

### 3. Public API unchanged in contract, extended in data

**Decision**: `/api/booked-slots` returns the same shape as before (`{ bookedSlots: [{ date, timeSlot }] }`). Blocked slots are added to the result set with the same shape. Clients and the booking wizard require no changes.

**Rationale**: Zero-risk change to the consumer. The booking wizard (`Step1Calendar.tsx`) and `FullCalendar.tsx` treat all returned slots identically.

### 4. Separate admin endpoint for typed slots

**Decision**: New `GET /api/admin/booked-slots` returns `{ slots: [{ date, timeSlot, type: 'reservation'|'blocked', reason? }] }`.

**Rationale**: The admin calendar needs to distinguish types for visual differentiation. Adding a `type` field to the public endpoint would leak internal state to clients. Keeping it separate is cleaner and maintains the principle of least privilege.

### 5. PATCH /api/admin/block-dates/[id] for reason edits

**Decision**: Dynamic route file `src/pages/api/admin/block-dates/[id].ts` handles `PATCH { reason }`.

**Rationale**: Follows existing pattern of dynamic routes (e.g., `/api/admin/reservations/[id].ts`). Only the reason can be edited — date and slot are structural and would require delete+recreate.

### 6. Google Calendar: one event per blocked slot

**Decision**: Create one Google Calendar event per `(date, time_slot)` pair. Store `google_calendar_event_id` in `blocked_slots`. Delete the event when the slot is unblocked.

**Rationale**: Maps 1:1 to the booking calendar time slots. Easier to manage than multi-day or multi-slot events. Uses `colorId: 11` (Tomato/red) to distinguish from reservation events.

**Alternatives considered**: One event per day grouping all blocked slots — rejected because partial-day unblocking would require recreating the event, adding complexity.

### 7. Admin UI: dedicated page (not modal)

**Decision**: `/admin/reservations/blocked-dates` is a standalone page under `AdminLayout`, linked from the reservations index via a "Bloquear fechas" button.

**Rationale**: The CRUD table + creation form would be cramped in a modal. A dedicated page follows the pattern of other admin sub-pages (e.g., `approve-reservation`). The button placement near the existing action area keeps discoverability high.

## Risks / Trade-offs

- **Google Calendar failures**: If GCal event creation fails, the slot is still blocked in DB. The `google_calendar_event_id` will be null. Deletion will handle null gracefully. Acceptable — the DB is the source of truth.
- **Blocking already-reserved slots**: The UNIQUE constraint prevents double-blocking, but there's no guard against blocking a slot that already has a reservation. The admin must check manually. Acceptable for MVP given the small team.
- **No undo for bulk delete**: Deleting multiple blocked slots is irreversible from the UI. Mitigated by confirmation dialog showing count of slots to be deleted.
