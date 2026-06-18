// src/pages/api/events/collaborative/[id]/detalles/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

const addItemSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(['decoration', 'favors', 'special_request', 'other']).optional(),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),
  responsible_participant_id: z.number().int().positive().optional().nullable(),
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

  if (req.method === 'GET') {
    const result = await query(
      `SELECT * FROM event_detail_items WHERE event_id = $1 ORDER BY created_at ASC`,
      [eventId]
    );
    return res.status(200).json({ items: result.rows });
  }

  if (req.method === 'POST') {
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, category, description, quantity, responsible_participant_id } = parsed.data;

    const result = await query(
      `INSERT INTO event_detail_items (event_id, title, category, description, quantity, responsible_participant_id, added_by_participant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        eventId,
        title,
        category ?? 'other',
        description ?? null,
        quantity ?? null,
        responsible_participant_id ?? null,
        participant?.id ?? null,
      ]
    );

    return res.status(201).json({ item: result.rows[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
