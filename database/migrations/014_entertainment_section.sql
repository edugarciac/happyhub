-- database/migrations/014_entertainment_section.sql

-- Canciones sugeridas para el evento
CREATE TABLE IF NOT EXISTS event_entertainment_songs (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  spotify_track_id VARCHAR(100),
  spotify_track_uri VARCHAR(150),
  suggested_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conexión Spotify del organizador (una por evento)
CREATE TABLE IF NOT EXISTS event_spotify_connections (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE REFERENCES collaborative_events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  playlist_id VARCHAR(100),
  playlist_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actividades propuestas para el evento
CREATE TABLE IF NOT EXISTS event_activities (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  proposed_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votos en actividades (toggle, un voto por participante)
CREATE TABLE IF NOT EXISTS event_activity_votes (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES event_activities(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES collaborative_event_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, participant_id)
);

-- Base de conocimiento de actividades (admin-gestionada)
CREATE TABLE IF NOT EXISTS activity_templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_types TEXT[],
  participant_types TEXT[],
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_songs_event ON event_entertainment_songs(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_event ON event_activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activity_votes_activity ON event_activity_votes(activity_id);
