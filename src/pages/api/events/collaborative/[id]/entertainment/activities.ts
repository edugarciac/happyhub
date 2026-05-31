import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
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

  const participantId = participant?.id ?? null;

  if (req.method === 'GET') {
    const result = await query(
      `SELECT a.*,
         COUNT(v.id)::int AS votes_count,
         BOOL_OR(v.participant_id = $2) AS user_voted,
         p.name AS proposed_by_name
       FROM event_activities a
       LEFT JOIN event_activity_votes v ON v.activity_id = a.id
       LEFT JOIN collaborative_event_participants p ON p.id = a.proposed_by_participant_id
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

  return res.status(405).json({ error: 'Method not allowed' });
}
