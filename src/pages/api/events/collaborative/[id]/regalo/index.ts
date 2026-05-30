// src/pages/api/events/collaborative/[id]/regalo/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

  const [itemsResult, fundResult] = await Promise.all([
    query(`SELECT * FROM event_gift_items WHERE event_id = $1 ORDER BY created_at ASC`, [eventId]),
    query(`SELECT * FROM event_gift_fund WHERE event_id = $1`, [eventId]),
  ]);

  return res.status(200).json({
    items: itemsResult.rows,
    fund: fundResult.rows[0] || null,
  });
}
