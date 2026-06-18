// src/pages/api/events/collaborative/[id]/detalles/[itemId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

const updateItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.enum(['decoration', 'favors', 'special_request', 'other']).optional(),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),
  responsible_participant_id: z.number().int().positive().optional().nullable(),
  done: z.boolean().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const itemId = parseInt(req.query.itemId as string, 10);
  if (isNaN(eventId) || isNaN(itemId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const itemResult = await query(
    `SELECT * FROM event_detail_items WHERE id = $1 AND event_id = $2`,
    [itemId, eventId]
  );
  const item = itemResult.rows[0];
  if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });

  if (req.method === 'PATCH') {
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const fields = parsed.data;
    const keys = Object.keys(fields) as (keyof typeof fields)[];
    if (keys.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

    const setClauses = keys.map((key, i) => `${key} = $${i + 2}`);
    const values = keys.map((key) => fields[key] ?? null);

    const result = await query(
      `UPDATE event_detail_items SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      [itemId, ...values]
    );

    return res.status(200).json({ item: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    const isAdder = participant && item.added_by_participant_id === participant.id;
    if (!isAdder && !isOrganizer) return res.status(403).json({ error: 'Sin permisos para eliminar este ítem' });

    await query(`DELETE FROM event_detail_items WHERE id = $1`, [itemId]);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
