## Why

Deleting a client from the admin panel (`DELETE /api/admin/clients/:id`) returns a generic 500 "Error interno" when the user is linked to a collaborative event. Production logs (2026-11-04, user 230) show:

```
violates foreign key constraint "collaborative_events_organizer_id_fkey"
Key (id)=(230) is still referenced from table "collaborative_events".
```

`collaborative_events.organizer_id` and `collaborative_event_participants.user_id` reference `users(id)` with no `ON DELETE` rule. The delete handler only pre-checks `reservations`, so any other reference crashes the request. Participant rows are also auto-linked on every login (`linkParticipantsToUser`), so any invited user becomes undeletable.

## What changes

- `collaborative_event_participants.user_id` → `ON DELETE SET NULL` (the guest row stays, keyed by name/email, as before they had an account).
- Deleting a user who **organizes** collaborative events is blocked with a clear 409 (same pattern as reservations), because deleting would destroy other people's event data.
- Any remaining FK violation (Postgres `23503`) in the delete handler returns a 409 with a readable message instead of a 500.

## Capabilities

### Modified capabilities
- `client-deletion`: admin client deletion pre-checks and error handling.

## Impact

- **DB**: migration `035_collab_participants_user_fk.sql` + same rule in `ensureCollaborativeEventsSchema` for fresh installs.
- **API**: `src/pages/api/admin/clients/[id].ts` (`handleDelete`).
- **Frontend**: none (admin UI already shows `error` from the response).
