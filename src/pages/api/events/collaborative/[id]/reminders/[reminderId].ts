// src/pages/api/events/collaborative/[id]/reminders/[reminderId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

const updateReminderSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  notes: z.string().max(1000).optional().nullable(),
  due_date: z.string().optional().nullable(),
  emoji: z.string().max(10).optional().nullable(),
  assigned_participant_id: z.number().int().optional().nullable(),
  completed: z.boolean().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const reminderId = parseInt(req.query.reminderId as string, 10);
  if (isNaN(eventId) || isNaN(reminderId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  if (req.method === 'PATCH') {
    const parsed = updateReminderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(parsed.data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

    values.push(reminderId, eventId);
    const result = await query(
      `UPDATE event_reminders SET ${fields.join(', ')} WHERE id = $${idx++} AND event_id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Recordatorio no encontrado' });
    return res.status(200).json({ reminder: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM event_reminders WHERE id = $1 AND event_id = $2`, [reminderId, eventId]);
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
