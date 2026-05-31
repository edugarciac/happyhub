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
  const activityId = parseInt(req.query.activityId as string, 10);
  if (isNaN(eventId) || isNaN(activityId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

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

  return res.status(405).json({ error: 'Method not allowed' });
}
