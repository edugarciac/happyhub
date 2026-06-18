-- database/migrations/015_event_details_section.sql

CREATE TABLE IF NOT EXISTS event_detail_items (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'other',
  description TEXT,
  quantity INTEGER,
  responsible_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  added_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_detail_items_event ON event_detail_items(event_id);
