import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  completed: z.boolean().optional(),
  detail_data: z.record(z.any()).optional().nullable(),
  phase: z.enum(['before', 'during', 'after']).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const tid = parseInt(req.query.tid as string, 10);

  if (isNaN(eventId) || isNaN(tid)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Solo el organizador puede editar hitos' });

  const existing = await query(
    `SELECT id FROM collaborative_event_timeline WHERE id = $1 AND event_id = $2`,
    [tid, eventId]
  );
  if (!existing.rows.length) return res.status(404).json({ error: 'Hito no encontrado' });

  if (req.method === 'PATCH') {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const d = parsed.data;
    if (d.title !== undefined) { fields.push(`title = $${idx++}`); values.push(d.title); }
    if (d.time !== undefined) { fields.push(`time = $${idx++}`); values.push(d.time); }
    if (d.description !== undefined) { fields.push(`description = $${idx++}`); values.push(d.description); }
    if (d.completed !== undefined) { fields.push(`completed = $${idx++}`); values.push(d.completed); }
    if (d.detail_data !== undefined) { fields.push(`detail_data = $${idx++}`); values.push(d.detail_data ? JSON.stringify(d.detail_data) : null); }
    if (d.phase !== undefined) { fields.push(`phase = $${idx++}`); values.push(d.phase); }

    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });

    values.push(tid);
    const result = await query(
      `UPDATE collaborative_event_timeline SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.status(200).json({ milestone: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM collaborative_event_timeline WHERE id = $1`, [tid]);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
