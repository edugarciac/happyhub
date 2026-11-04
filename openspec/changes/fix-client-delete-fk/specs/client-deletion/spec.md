## Capability: client-deletion

### Requirements

#### REQ-1: Block deletion of organizers
- If the user is `organizer_id` of any `collaborative_events` row, `DELETE /api/admin/clients/:id` returns **409** with `error: "No se puede eliminar: el cliente organiza N evento(s) colaborativo(s)"`.

#### REQ-2: Participant links are released
- Deleting a user sets `collaborative_event_participants.user_id = NULL` for their rows; the rows (name, email, RSVP) are kept.

#### REQ-3: No generic 500 on FK violations
- Any Postgres `23503` raised by the delete returns **409** with `error: "No se puede eliminar: el cliente tiene datos asociados (<table>)"`.

#### REQ-4: Existing behaviour unchanged
- Users with reservations still get the existing 409.
- Users with no references are deleted (200), cascading tables (spotify, password reset, etc.) unchanged.
