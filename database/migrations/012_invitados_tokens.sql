ALTER TABLE collaborative_event_participants
  ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rsvp_note TEXT;

CREATE INDEX IF NOT EXISTS idx_participants_invite_token ON collaborative_event_participants(invite_token);
