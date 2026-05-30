CREATE TABLE IF NOT EXISTS event_gift_items (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  price_approx NUMERIC(10,2),
  emoji VARCHAR(10),
  added_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  reserved_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  reserved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_gift_fund (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_amount NUMERIC(10,2),
  current_amount NUMERIC(10,2) DEFAULT 0,
  payment_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gift_items_event ON event_gift_items(event_id);
