import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const activityId = parseInt(req.query.activityId as string, 10);
  if (isNaN(eventId) || isNaN(activityId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  if (!participant) return res.status(400).json({ error: 'Solo los invitados pueden votar' });

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
}
