import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventById,
  getParticipantByUserId,
  updateParticipant,
} from '@/utils/db/collaborative-events';
import { query } from '@/lib/db';
import type { CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

const updateSchema = z.object({
  rsvp_status: z.enum(['pending', 'confirmed', 'declined', 'maybe']).optional(),
  role: z.enum(['organizer', 'co-organizer', 'participant']).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Método no permitido' });

  await ensureCollaborativeEventsSchema();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const pid = parseInt(req.query.pid as string, 10);

  if (isNaN(eventId) || isNaN(pid)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  // Fetch the target participant
  const targetResult = await query<CollaborativeEventParticipant>(
    'SELECT * FROM collaborative_event_participants WHERE id = $1 AND event_id = $2',
    [pid, eventId]
  );
  const target = targetResult.rows[0];
  if (!target) return res.status(404).json({ error: 'Participante no encontrado' });

  const callerParticipant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  const isOwnParticipant = target.user_id === userId;

  const result = updateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: result.error.flatten() });
  }

  const { rsvp_status, role } = result.data;

  // Role changes: only organizer can change roles
  if (role !== undefined && !isOrganizer) {
    return res.status(403).json({ error: 'Solo el organizador puede cambiar roles' });
  }

  // RSVP: only the participant themselves or organizer
  if (rsvp_status !== undefined && !isOwnParticipant && !isOrganizer && callerParticipant?.role !== 'co-organizer') {
    return res.status(403).json({ error: 'Sin permisos para cambiar este RSVP' });
  }

  const updated = await updateParticipant(pid, result.data);
  return res.status(200).json(updated);
}
