-- Run this ONLY after scripts/backfill-user-spotify-connections.js has been
-- run successfully against the same database (it copies any existing
-- per-event Spotify tokens into user_spotify_connections and sets
-- user_connection_id on every event_spotify_connections row). Running this
-- migration first would delete tokens the backfill script still needs.
ALTER TABLE event_spotify_connections
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS token_expires_at;
