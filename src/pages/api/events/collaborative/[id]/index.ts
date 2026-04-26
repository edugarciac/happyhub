import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventById,
  updateCollaborativeEvent,
  getParticipants,
  getTimeline,
  getParticipantByUserId,
} from '@/utils/db/collaborative-events';

const updateSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  event_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  status: z.enum(['planning', 'active', 'event-day', 'completed', 'cancelled']).optional(),
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

  // Verify user is a participant or organizer
  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;

  if (!participant && !isOrganizer) {
    return res.status(403).json({ error: 'No tienes acceso a este evento' });
  }

  if (req.method === 'GET') {
    const [participants, timeline] = await Promise.all([
      getParticipants(eventId),
      getTimeline(eventId),
    ]);
    return res.status(200).json({ event, participants, timeline });
  }

  if (req.method === 'PATCH') {
    if (!isOrganizer && participant?.role !== 'co-organizer') {
      return res.status(403).json({ error: 'Solo el organizador puede editar el evento' });
    }

    const result = updateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: result.error.flatten() });
    }

    const updated = await updateCollaborativeEvent(eventId, result.data);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
