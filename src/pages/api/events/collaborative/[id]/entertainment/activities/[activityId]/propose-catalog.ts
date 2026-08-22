import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, parseIntParam } from '@/lib/apiMiddleware';
import { query, queryOne } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, participant, isOrganizer } = ctx;

  const activityId = parseIntParam(req.query.activityId);
  if (activityId === null) return res.status(400).json({ error: 'ID inválido' });

  const activity = await queryOne<{ id: number; title: string; description: string | null; proposed_by_participant_id: number | null }>(
    `SELECT id, title, description, proposed_by_participant_id FROM event_activities WHERE id = $1 AND event_id = $2`,
    [activityId, eventId]
  );
  if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

  const isOwner = participant && activity.proposed_by_participant_id === participant.id;
  if (!isOwner && !isOrganizer) {
    return res.status(403).json({ error: 'Solo quien propuso la actividad, o el organizador, puede enviarla al catálogo' });
  }

  const existingPending = await queryOne<{ id: number }>(
    `SELECT id FROM activity_catalog_proposals WHERE event_activity_id = $1 AND status = 'pending'`,
    [activityId]
  );
  if (existingPending) {
    return res.status(409).json({ error: 'already_proposed' });
  }

  const result = await query(
    `INSERT INTO activity_catalog_proposals (event_activity_id, event_id, proposed_by_participant_id, title, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, status`,
    [activityId, eventId, participant?.id ?? null, activity.title, activity.description]
  );

  return res.status(201).json({ proposalId: result.rows[0].id, status: result.rows[0].status });
});
