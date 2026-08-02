import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, parseIntParam, methodNotAllowed } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  const { eventId, participant, isOrganizer } = ctx;

  const songId = parseIntParam(req.query.songId);
  if (songId === null) return res.status(400).json({ error: 'ID inválido' });

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

  return methodNotAllowed(res);
});
