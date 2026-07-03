import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, parseIntParam, methodNotAllowed } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  const { eventId, participant, isOrganizer } = ctx;

  const activityId = parseIntParam(req.query.activityId);
  if (activityId === null) return res.status(400).json({ error: 'ID inválido' });

  const actResult = await query(
    `SELECT * FROM event_activities WHERE id = $1 AND event_id = $2`,
    [activityId, eventId]
  );
  if (actResult.rows.length === 0) return res.status(404).json({ error: 'Actividad no encontrada' });
  const activity = actResult.rows[0];

  if (req.method === 'PATCH') {
    if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede aprobar actividades' });
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const result = await query(
      `UPDATE event_activities SET status = $1 WHERE id = $2 RETURNING *`,
      [parsed.data.status, activityId]
    );
    return res.status(200).json({ activity: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    const canDelete = isOrganizer || activity.proposed_by_participant_id === participant?.id;
    if (!canDelete) return res.status(403).json({ error: 'Sin permiso' });

    await query(`DELETE FROM event_activities WHERE id = $1`, [activityId]);
    return res.status(200).json({ ok: true });
  }

  return methodNotAllowed(res);
});
