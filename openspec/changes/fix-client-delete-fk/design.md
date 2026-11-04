## Context

Admin delete of a user fails with 500 when the user is referenced by `collaborative_events` (organizer) or `collaborative_event_participants` (user_id). Both FKs were created without `ON DELETE`.

## Decisions

1. **Participants → `ON DELETE SET NULL`.** A participant row already supports `user_id = NULL` (anonymous/RSVP guests). Nulling it keeps the organizer's guest list intact. The `UNIQUE(event_id, user_id)` constraint allows multiple NULLs, so no conflict.
2. **Organizer → block, not cascade.** Cascading would silently delete an event plus its guests, timeline and RSVPs that belong to other people. Admin gets a 409: "No se puede eliminar: el cliente organiza N evento(s) colaborativo(s)". If needed later, add "reassign organizer" as a separate change.
3. **Safety net for `23503`.** Wrap the `DELETE` and map FK violations to 409 with the constraint's table name, so future tables referencing `users` never surface as "Error interno".

## Migration

```sql
ALTER TABLE collaborative_event_participants
  DROP CONSTRAINT IF EXISTS collaborative_event_participants_user_id_fkey,
  ADD CONSTRAINT collaborative_event_participants_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

Idempotent; run manually on Neon (same as previous migrations).

## Risks

- Constraint name differs in prod → `DROP ... IF EXISTS` does nothing and the ADD creates a duplicate FK. Mitigation: verify name with `\d collaborative_event_participants` before running.
