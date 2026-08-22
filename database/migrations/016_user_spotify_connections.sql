-- User-level Spotify connection (one per user, reusable across events),
-- replacing the previous per-event OAuth token storage.
CREATE TABLE IF NOT EXISTS user_spotify_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  spotify_user_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(255),
  product VARCHAR(20) NOT NULL, -- 'premium' | 'free'
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- event_spotify_connections becomes a pointer to a user connection + the
-- playlist chosen for that event, in addition to (for now) its existing
-- token columns. The token columns are dropped separately in migration 017,
-- AFTER scripts/backfill-user-spotify-connections.js has copied any existing
-- per-event tokens into user_spotify_connections — do not run 017 first.
ALTER TABLE event_spotify_connections
  ADD COLUMN IF NOT EXISTS user_connection_id INTEGER REFERENCES user_spotify_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_new_playlist BOOLEAN DEFAULT TRUE,
  ALTER COLUMN user_id DROP NOT NULL;
