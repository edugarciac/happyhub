import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const songId = parseInt(req.query.songId as string, 10);
  if (isNaN(eventId) || isNaN(songId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const songResult = await query(
    `SELECT * FROM event_entertainment_songs WHERE id = $1 AND event_id = $2`,
    [songId, eventId]
  );
  if (songResult.rows.length === 0) return res.status(404).json({ error: 'Canción no encontrada' });
  const song = songResult.rows[0];

  if (req.method === 'PATCH') {
    if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede aprobar canciones' });
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const result = await query(
      `UPDATE event_entertainment_songs SET status = $1 WHERE id = $2 RETURNING *`,
      [parsed.data.status, songId]
    );
    return res.status(200).json({ song: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    const canDelete = isOrganizer || song.suggested_by_participant_id === participant?.id;
    if (!canDelete) return res.status(403).json({ error: 'Sin permiso para eliminar esta canción' });

    await query(`DELETE FROM event_entertainment_songs WHERE id = $1`, [songId]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
