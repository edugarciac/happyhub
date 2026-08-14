import type { NextApiResponse } from 'next';
import { z } from 'zod';
import { withCollaborativeEventAuth, methodNotAllowed } from '@/lib/apiMiddleware';
import { query, queryOne } from '@/lib/db';
import { getUserSpotifyConnection, getValidAccessToken } from '@/lib/spotify';

type StatusResponse =
  | { status: 'not_connected' }
  | { status: 'not_premium'; displayName: string | null }
  | { status: 'needs_playlist_choice' }
  | { status: 'not_active' }
  | { status: 'ready'; playlistUrl: string | null; playlistName: string | null; isNewPlaylist: boolean; displayName: string | null };

const putSchema = z.object({
  mode: z.enum(['new', 'existing']),
  playlistName: z.string().min(1).max(255).optional(),
  playlistId: z.string().min(1).optional(),
}).refine(
  (data) => (data.mode === 'new' ? !!data.playlistName : !!data.playlistId),
  { message: 'playlistName es requerido para mode=new, playlistId para mode=existing' }
);

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  const { eventId, event, isOrganizer, userId } = ctx;

  if (req.method === 'GET') {
    // Anyone (organizer or participant) sees the actual ready state if music
    // has already been set up for this event, regardless of who set it up.
    const existingConn = await queryOne<{ playlist_id: string | null; playlist_url: string | null; is_new_playlist: boolean; user_connection_id: number | null }>(
      `SELECT playlist_id, playlist_url, is_new_playlist, user_connection_id FROM event_spotify_connections WHERE event_id = $1`,
      [eventId]
    );
    if (existingConn?.playlist_id && existingConn.user_connection_id) {
      const ownerConn = await queryOne<{ display_name: string | null }>(
        `SELECT display_name FROM user_spotify_connections WHERE id = $1`,
        [existingConn.user_connection_id]
      );
      return res.status(200).json({
        status: 'ready',
        playlistUrl: existingConn.playlist_url,
        playlistName: event.title,
        isNewPlaylist: existingConn.is_new_playlist,
        displayName: ownerConn?.display_name ?? null,
      } as StatusResponse);
    }

    // Not ready yet: participants just see "not active", only the organizer
    // gets the setup-flow detail (their own connection status).
    if (!isOrganizer) return res.status(200).json({ status: 'not_active' } as StatusResponse);

    const userConn = await getUserSpotifyConnection(userId);
    if (!userConn) return res.status(200).json({ status: 'not_connected' } as StatusResponse);
    if (userConn.product !== 'premium') {
      return res.status(200).json({ status: 'not_premium', displayName: userConn.display_name } as StatusResponse);
    }

    return res.status(200).json({ status: 'needs_playlist_choice' } as StatusResponse);
  }

  if (req.method === 'PUT') {
    if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede configurar la música' });

    const userConn = await getUserSpotifyConnection(userId);
    if (!userConn) return res.status(403).json({ error: 'spotify_not_connected' });
    if (userConn.product !== 'premium') return res.status(403).json({ error: 'spotify_not_premium' });

    const parsed = putSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    try {
      const token = await getValidAccessToken(userConn.id);
      let playlistId: string;
      let playlistUrl: string | null;
      let isNewPlaylist: boolean;

      if (parsed.data.mode === 'new') {
        const createRes = await fetch(`https://api.spotify.com/v1/users/${userConn.spotify_user_id}/playlists`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: parsed.data.playlistName,
            description: `Playlist colaborativa de ${event.title} - HappyHub`,
            public: true,
          }),
        });
        if (!createRes.ok) return res.status(502).json({ error: 'Error creando la playlist en Spotify' });
        const playlist = await createRes.json();
        playlistId = playlist.id;
        playlistUrl = playlist.external_urls?.spotify || null;
        isNewPlaylist = true;
      } else {
        const checkRes = await fetch(`https://api.spotify.com/v1/playlists/${parsed.data.playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!checkRes.ok) return res.status(400).json({ error: 'Playlist no encontrada' });
        const playlist = await checkRes.json();
        if (playlist.owner?.id !== userConn.spotify_user_id) {
          return res.status(403).json({ error: 'La playlist no pertenece a tu cuenta' });
        }
        playlistId = playlist.id;
        playlistUrl = playlist.external_urls?.spotify || null;
        isNewPlaylist = false;
      }

      await query(
        `INSERT INTO event_spotify_connections (event_id, user_id, user_connection_id, playlist_id, playlist_url, is_new_playlist)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (event_id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           user_connection_id = EXCLUDED.user_connection_id,
           playlist_id = EXCLUDED.playlist_id,
           playlist_url = EXCLUDED.playlist_url,
           is_new_playlist = EXCLUDED.is_new_playlist,
           updated_at = NOW()`,
        [eventId, userId, userConn.id, playlistId, playlistUrl, isNewPlaylist]
      );

      return res.status(200).json({ connected: true, playlistUrl, isNewPlaylist });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return methodNotAllowed(res);
});
