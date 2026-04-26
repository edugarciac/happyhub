import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventById,
  getParticipantByUserId,
  getTimeline,
  addTimelineEntry,
} from '@/utils/db/collaborative-events';

const createSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  responsible_participant_id: z.number().int().positive().optional(),
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

  if (!participant && !isOrganizer) {
    return res.status(403).json({ error: 'No tienes acceso a este evento' });
  }

  if (req.method === 'GET') {
    const timeline = await getTimeline(eventId);
    return res.status(200).json(timeline);
  }

  if (req.method === 'POST') {
    if (!isOrganizer && participant?.role !== 'co-organizer') {
      return res.status(403).json({ error: 'Solo el organizador puede editar el timeline' });
    }

    const result = createSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: result.error.flatten() });
    }

    const entry = await addTimelineEntry({ event_id: eventId, ...result.data });
    return res.status(201).json(entry);
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
