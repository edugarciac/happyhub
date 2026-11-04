## Tasks

### Database
- [x] T1: Add `database/migrations/035_collab_participants_user_fk.sql` (participants.user_id → ON DELETE SET NULL)
- [x] T2: Update `ensureCollaborativeEventsSchema` so new installs get `ON DELETE SET NULL` on participants.user_id
- [ ] T3: Run migration on Neon production (manual, after verifying constraint name)

### API
- [x] T4: In `handleDelete`, pre-check `collaborative_events.organizer_id` and return 409 with count
- [x] T5: Catch `23503` on DELETE and return 409 with readable message

### Verification
- [x] T6: `npx tsc --noEmit` passes
- [ ] T7: In prod, deleting user 230 returns the 409 organizer message (not 500)
