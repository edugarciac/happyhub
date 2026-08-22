// One-off backfill: copies existing per-event Spotify OAuth tokens
// (event_spotify_connections, pre-migration model) into the new
// user_spotify_connections table, and points each event row at the
// resulting user connection via user_connection_id.
//
// Run this AFTER migration 016 and BEFORE migration 017 (which drops the
// token columns this script reads from). Safe to re-run — it skips event
// connections that already have a user_connection_id set.
//
// Usage: node scripts/backfill-user-spotify-connections.js
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function refreshableProduct(accessToken) {
  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const me = await res.json();
    return { product: me.product, spotifyUserId: me.id, displayName: me.display_name || null };
  } catch {
    return null;
  }
}

async function run() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM event_spotify_connections WHERE user_connection_id IS NULL`
    );
    console.log(`Found ${rows.length} event connection(s) to backfill.`);

    for (const conn of rows) {
      if (!conn.access_token || !conn.refresh_token) {
        console.warn(`  event_id=${conn.event_id}: no tokens present, skipping.`);
        continue;
      }
      if (!conn.user_id) {
        console.warn(`  event_id=${conn.event_id}: no user_id on connection, skipping (needs manual review).`);
        continue;
      }

      const profile = await refreshableProduct(conn.access_token);
      // Best-effort: if the live check fails (e.g. expired access token,
      // not worth refreshing for a one-off backfill), mark as 'free' so the
      // user is prompted to reconnect and re-verify rather than silently
      // trusting a stale/unknown Premium status.
      const product = profile?.product || 'free';
      const spotifyUserId = profile?.spotifyUserId || `unknown-${conn.user_id}`;
      const displayName = profile?.displayName || null;

      const upsert = await client.query(
        `INSERT INTO user_spotify_connections
           (user_id, spotify_user_id, display_name, product, access_token, refresh_token, token_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
           access_token = EXCLUDED.access_token,
           refresh_token = EXCLUDED.refresh_token,
           token_expires_at = EXCLUDED.token_expires_at,
           updated_at = NOW()
         RETURNING id`,
        [conn.user_id, spotifyUserId, displayName, product, conn.access_token, conn.refresh_token, conn.token_expires_at]
      );
      const userConnectionId = upsert.rows[0].id;

      await client.query(
        `UPDATE event_spotify_connections
         SET user_connection_id = $1, is_new_playlist = $2
         WHERE event_id = $3`,
        [userConnectionId, !conn.playlist_id ? true : false, conn.event_id]
      );

      console.log(`  event_id=${conn.event_id}: linked to user_connection_id=${userConnectionId} (product=${product}).`);
    }

    console.log('Backfill complete. Verify results, then run migration 017 to drop the old token columns.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
