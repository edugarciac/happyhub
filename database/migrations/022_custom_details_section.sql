CREATE TABLE IF NOT EXISTS event_custom_details (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE REFERENCES collaborative_events(id) ON DELETE CASCADE,
  reminder_text_short VARCHAR(25),
  reminder_text_medium VARCHAR(40),
  -- Solo visible para el organizador vía API autenticada, nunca exponer en flujos públicos/recordatorios
  internal_notes TEXT,
  image_url_1 VARCHAR(500),
  image_url_2 VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_details_event ON event_custom_details(event_id);
