import type { NextApiRequest, NextApiResponse } from 'next';
import { withCollaborativeEventAuth, methodNotAllowed } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  const { eventId, participant } = ctx;
  const participantId = participant?.id ?? null;

  if (req.method === 'GET') {
    const result = await query(
      `SELECT a.*,
         COUNT(DISTINCT v.id)::int AS votes_count,
         BOOL_OR(v.participant_id = $2) AS user_voted,
         p.name AS proposed_by_name,
         BOOL_OR(cp.id IS NOT NULL) AS has_pending_proposal
       FROM event_activities a
       LEFT JOIN event_activity_votes v ON v.activity_id = a.id
       LEFT JOIN collaborative_event_participants p ON p.id = a.proposed_by_participant_id
       LEFT JOIN activity_catalog_proposals cp ON cp.event_activity_id = a.id AND cp.status = 'pending'
       WHERE a.event_id = $1
       GROUP BY a.id, p.name
       ORDER BY a.created_at ASC`,
      [eventId, participantId]
    );
    return res.status(200).json({ activities: result.rows });
  }

  if (req.method === 'POST') {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const result = await query(
      `INSERT INTO event_activities (event_id, title, description, proposed_by_participant_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [eventId, parsed.data.title, parsed.data.description || null, participantId]
    );

    // Incrementar usage_count si el título coincide con un template
    await query(
      `UPDATE activity_templates SET usage_count = usage_count + 1 WHERE title = $1`,
      [parsed.data.title]
    );

    return res.status(201).json({ activity: result.rows[0] });
  }

  return methodNotAllowed(res);
});
