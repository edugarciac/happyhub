import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, parseIntParam } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, participant } = ctx;

  const activityId = parseIntParam(req.query.activityId);
  if (activityId === null) return res.status(400).json({ error: 'ID inválido' });

  if (!participant) return res.status(400).json({ error: 'Solo los invitados pueden votar' });

  // Verificar que la actividad pertenece al evento
  const actResult = await query(
    `SELECT id FROM event_activities WHERE id = $1 AND event_id = $2`,
    [activityId, eventId]
  );
  if (actResult.rows.length === 0) return res.status(404).json({ error: 'Actividad no encontrada' });

  const existing = await query(
    `SELECT id FROM event_activity_votes WHERE activity_id = $1 AND participant_id = $2`,
    [activityId, participant.id]
  );

  if (existing.rows.length > 0) {
    await query(
      `DELETE FROM event_activity_votes WHERE activity_id = $1 AND participant_id = $2`,
      [activityId, participant.id]
    );
    return res.status(200).json({ action: 'unvoted' });
  } else {
    await query(
      `INSERT INTO event_activity_votes (activity_id, participant_id) VALUES ($1, $2)`,
      [activityId, participant.id]
    );
    return res.status(200).json({ action: 'voted' });
  }
});
