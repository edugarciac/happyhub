import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventById,
  getParticipantByUserId,
} from '@/utils/db/collaborative-events';

const addSchema = z.object({
  title: z.string().min(1).max(255),
  emoji: z.string().max(10).optional().nullable(),
  hito_type: z.string().max(50),
  phase: z.enum(['before', 'during', 'after']),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  detail_data: z.record(z.any()).optional().nullable(),
  sort_order: z.number().int().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureCollaborativeEventsSchema();

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
      `SELECT * FROM collaborative_event_timeline WHERE event_id = $1 ORDER BY
        CASE phase WHEN 'before' THEN 0 WHEN 'during' THEN 1 WHEN 'after' THEN 2 ELSE 3 END,
        sort_order, time`,
      [eventId]
    );
    return res.status(200).json({ milestones: result.rows });
  }

  if (req.method === 'POST') {
    if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede añadir hitos' });

    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, emoji, hito_type, phase, time, description, detail_data, sort_order } = parsed.data;

    const maxOrder = await query(
      `SELECT COALESCE(MAX(sort_order), -1) as max FROM collaborative_event_timeline WHERE event_id = $1 AND phase = $2`,
      [eventId, phase]
    );
    const nextOrder = sort_order ?? (maxOrder.rows[0].max + 1);

    const result = await query(
      `INSERT INTO collaborative_event_timeline
         (event_id, title, emoji, hito_type, phase, time, description, detail_data, sort_order, completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
       RETURNING *`,
      [eventId, title, emoji ?? null, hito_type, phase, time ?? null, description ?? null,
       detail_data ? JSON.stringify(detail_data) : null, nextOrder]
    );
    return res.status(201).json({ milestone: result.rows[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
