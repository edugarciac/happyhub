import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

async function getValidToken(conn: any): Promise<string> {
  if (conn.token_expires_at && new Date(conn.token_expires_at) > new Date()) {
    return conn.access_token;
  }
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${conn.refresh_token}`,
  });
  if (!res.ok) throw new Error('Error refrescando token de Spotify');
  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await query(
    `UPDATE event_spotify_connections SET access_token = $1, token_expires_at = $2, updated_at = NOW() WHERE event_id = $3`,
    [data.access_token, expiresAt, conn.event_id]
  );
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Solo el organizador' });

  const connResult = await query(
    `SELECT * FROM event_spotify_connections WHERE event_id = $1`,
    [eventId]
  );
  if (connResult.rows.length === 0) return res.status(400).json({ error: 'Spotify no conectado' });
  const conn = connResult.rows[0];

  try {
    const token = await getValidToken(conn);

    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return res.status(502).json({ error: 'Error obteniendo perfil Spotify' });
    const me = await meRes.json();

    let playlistId = conn.playlist_id;
    let playlistUrl = conn.playlist_url;

    if (!playlistId) {
      const createRes = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: event.title,
          description: `Playlist colaborativa de ${event.title} - HappyHub`,
          public: true,
        }),
      });
      if (!createRes.ok) return res.status(502).json({ error: 'Error creando playlist' });
      const playlist = await createRes.json();
      playlistId = playlist.id;
      playlistUrl = playlist.external_urls?.spotify || null;

      await query(
        `UPDATE event_spotify_connections SET playlist_id = $1, playlist_url = $2, updated_at = NOW() WHERE event_id = $3`,
        [playlistId, playlistUrl, eventId]
      );
    }

    const songsResult = await query(
      `SELECT spotify_track_uri FROM event_entertainment_songs
       WHERE event_id = $1 AND status = 'approved' AND spotify_track_uri IS NOT NULL`,
      [eventId]
    );

    if (songsResult.rows.length > 0) {
      const uris = songsResult.rows.map((r: any) => r.spotify_track_uri);
      const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris }),
      });
      if (!addRes.ok) return res.status(502).json({ error: 'Error añadiendo canciones a playlist' });
    }

    return res.status(200).json({ ok: true, playlistUrl, tracksAdded: songsResult.rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
