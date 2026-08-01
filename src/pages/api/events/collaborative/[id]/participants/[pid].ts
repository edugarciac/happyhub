import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, parseIntParam } from '@/lib/apiMiddleware';
import { z } from 'zod';
import {
  ensureCollaborativeEventsSchema,
  updateParticipant,
} from '@/utils/db/collaborative-events';
import { query } from '@/lib/db';
import type { CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

const updateSchema = z.object({
  rsvp_status: z.enum(['pending', 'confirmed', 'declined', 'maybe']).optional(),
  role: z.enum(['organizer', 'co-organizer', 'participant']).optional(),
});

export default async function handler(req: import('next').NextApiRequest, res: import('next').NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Método no permitido' });
  await ensureCollaborativeEventsSchema();

  return withCollaborativeEventAuth(async (_req, _res, ctx) => {
    const { eventId, userId, participant: callerParticipant, isOrganizer } = ctx;

    const pid = parseIntParam(_req.query.pid);
    if (pid === null) return _res.status(400).json({ error: 'ID inválido' });

    // Fetch the target participant
    const targetResult = await query<CollaborativeEventParticipant>(
      'SELECT * FROM collaborative_event_participants WHERE id = $1 AND event_id = $2',
      [pid, eventId]
    );
    const target = targetResult.rows[0];
    if (!target) return _res.status(404).json({ error: 'Participante no encontrado' });

    const isOwnParticipant = target.user_id === userId;

    const result = updateSchema.safeParse(_req.body);
    if (!result.success) {
      return _res.status(400).json({ error: 'Datos inválidos', details: result.error.flatten() });
    }

    const { rsvp_status, role } = result.data;

    // Role changes: only organizer can change roles
    if (role !== undefined && !isOrganizer) {
      return _res.status(403).json({ error: 'Solo el organizador puede cambiar roles' });
    }

    // RSVP: only the participant themselves or organizer
    if (rsvp_status !== undefined && !isOwnParticipant && !isOrganizer && callerParticipant?.role !== 'co-organizer') {
      return _res.status(403).json({ error: 'Sin permisos para cambiar este RSVP' });
    }

    const updated = await updateParticipant(pid, result.data);
    return _res.status(200).json(updated);
  })(req, res);
}
