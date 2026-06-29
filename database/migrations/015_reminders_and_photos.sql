-- database/migrations/015_reminders_and_photos.sql

CREATE TABLE IF NOT EXISTS event_reminders (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  notes TEXT,
  due_date DATE,
  emoji VARCHAR(10),
  assigned_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  created_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_photos (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  uploaded_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_event ON event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_event ON event_photos(event_id);
