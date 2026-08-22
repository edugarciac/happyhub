CREATE INDEX IF NOT EXISTS idx_participants_email
  ON collaborative_event_participants (lower(email))
  WHERE email IS NOT NULL;
