import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';
import { parseIntParam, buildDynamicUpdate, methodNotAllowed } from '@/lib/apiMiddleware';

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
  const eventId = parseIntParam(req.query.id);
  const tid = parseIntParam(req.query.tid);

  if (eventId === null || tid === null) return res.status(400).json({ error: 'ID inválido' });

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

    const d = parsed.data;
    const upd = buildDynamicUpdate({
      title: d.title,
      time: d.time,
      description: d.description,
      completed: d.completed,
      detail_data: d.detail_data !== undefined
        ? (d.detail_data ? JSON.stringify(d.detail_data) : null)
        : undefined,
      phase: d.phase,
    });

    if (!upd) return res.status(400).json({ error: 'Nada que actualizar' });

    upd.params.push(tid);
    const result = await query(
      `UPDATE collaborative_event_timeline SET ${upd.setClauses} WHERE id = $${upd.nextIndex} RETURNING *`,
      upd.params as any[]
    );
    return res.status(200).json({ milestone: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM collaborative_event_timeline WHERE id = $1`, [tid]);
    return res.status(200).json({ deleted: true });
  }

  return methodNotAllowed(res);
}
