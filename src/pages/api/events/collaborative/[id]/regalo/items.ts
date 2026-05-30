// src/pages/api/events/collaborative/[id]/regalo/items.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

const addItemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional().nullable(),
  url: z.string().url().max(500).optional().nullable(),
  price_approx: z.number().positive().optional().nullable(),
  emoji: z.string().max(10).optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, url, price_approx, emoji } = parsed.data;

  const result = await query(
    `INSERT INTO event_gift_items (event_id, title, description, url, price_approx, emoji, added_by_participant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [eventId, title, description ?? null, url ?? null, price_approx ?? null, emoji ?? null, participant?.id ?? null]
  );

  return res.status(201).json({ item: result.rows[0] });
}
