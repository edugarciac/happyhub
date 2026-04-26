import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventById,
  getParticipantByUserId,
  updateTimelineEntry,
  deleteTimelineEntry,
} from '@/utils/db/collaborative-events';
import { queryOne } from '@/lib/db';
import type { CollaborativeEventTimeline } from '@/utils/db/collaborative-events';

const updateSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  responsible_participant_id: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureCollaborativeEventsSchema();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const tid = parseInt(req.query.tid as string, 10);

  if (isNaN(eventId) || isNaN(tid)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;

  if ((!participant && !isOrganizer) ||
      (!isOrganizer && participant?.role !== 'co-organizer')) {
    return res.status(403).json({ error: 'Solo el organizador puede editar el timeline' });
  }

  // Verify entry belongs to this event
  const entry = await queryOne<CollaborativeEventTimeline>(
    'SELECT * FROM collaborative_event_timeline WHERE id = $1 AND event_id = $2',
    [tid, eventId]
  );
  if (!entry) return res.status(404).json({ error: 'Entrada no encontrada' });

  if (req.method === 'PATCH') {
    const result = updateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: result.error.flatten() });
    }
    const updated = await updateTimelineEntry(tid, result.data);
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await deleteTimelineEntry(tid);
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
