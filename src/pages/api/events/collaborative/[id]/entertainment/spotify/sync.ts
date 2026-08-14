import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { query, queryOne } from '@/lib/db';
import { getValidAccessToken } from '@/lib/spotify';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, isOrganizer } = ctx;
  if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador' });

  const conn = await queryOne<{ playlist_id: string | null; playlist_url: string | null; user_connection_id: number | null }>(
    `SELECT playlist_id, playlist_url, user_connection_id FROM event_spotify_connections WHERE event_id = $1`,
    [eventId]
  );
  if (!conn || !conn.user_connection_id || !conn.playlist_id) {
    return res.status(400).json({ error: 'Música no configurada para este evento todavía' });
  }

  try {
    const token = await getValidAccessToken(conn.user_connection_id);

    const songsResult = await query(
      `SELECT spotify_track_uri FROM event_entertainment_songs
       WHERE event_id = $1 AND status = 'approved' AND spotify_track_uri IS NOT NULL`,
      [eventId]
    );

    if (songsResult.rows.length > 0) {
      const uris = songsResult.rows.map((r: any) => r.spotify_track_uri);
      const addRes = await fetch(`https://api.spotify.com/v1/playlists/${conn.playlist_id}/tracks`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris }),
      });
      if (!addRes.ok) return res.status(502).json({ error: 'Error añadiendo canciones a playlist' });
    }

    return res.status(200).json({ ok: true, playlistUrl: conn.playlist_url, tracksAdded: songsResult.rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
