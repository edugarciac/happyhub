-- Allow deleting users who are participants in collaborative events.
-- The participant row is kept (name/email/RSVP) and just unlinked from the account.
-- See openspec/changes/fix-client-delete-fk
ALTER TABLE collaborative_event_participants
  DROP CONSTRAINT IF EXISTS collaborative_event_participants_user_id_fkey,
  ADD CONSTRAINT collaborative_event_participants_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
