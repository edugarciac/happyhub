import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1).max(255),
  artist: z.string().max(255).optional(),
  spotifyTrackId: z.string().max(100).optional(),
  spotifyTrackUri: z.string().max(150).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  if (req.method === 'GET') {
    const [songsResult, spotifyResult] = await Promise.all([
      query(
        `SELECT s.*, p.name as suggested_by_name
         FROM event_entertainment_songs s
         LEFT JOIN collaborative_event_participants p ON p.id = s.suggested_by_participant_id
         WHERE s.event_id = $1 ORDER BY s.created_at ASC`,
        [eventId]
      ),
      query(
        `SELECT playlist_url, playlist_id FROM event_spotify_connections WHERE event_id = $1`,
        [eventId]
      ),
    ]);

    const spotifyConn = spotifyResult.rows[0] || null;
    return res.status(200).json({
      songs: songsResult.rows,
      spotify: spotifyConn
        ? { connected: true, playlistUrl: spotifyConn.playlist_url }
        : { connected: false, playlistUrl: null },
    });
  }

  if (req.method === 'POST') {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, artist, spotifyTrackId, spotifyTrackUri } = parsed.data;
    const result = await query(
      `INSERT INTO event_entertainment_songs
         (event_id, title, artist, spotify_track_id, spotify_track_uri, suggested_by_participant_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [eventId, title, artist || null, spotifyTrackId || null, spotifyTrackUri || null, participant?.id || null]
    );
    return res.status(201).json({ song: result.rows[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
