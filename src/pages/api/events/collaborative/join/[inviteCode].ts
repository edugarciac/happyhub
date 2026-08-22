import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventByInviteCode,
  addParticipant,
  getParticipantByUserId,
} from '@/utils/db/collaborative-events';

const joinSchema = z.object({
  name: z.string().min(2).max(255),
  // Required for anonymous joins (so the participant row can later be linked
  // to an account by email); logged-in joiners get their email from the session.
  email: z.string().email().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  await ensureCollaborativeEventsSchema();

  const inviteCode = req.query.inviteCode as string;
  const event = await getCollaborativeEventByInviteCode(inviteCode);
  if (!event) return res.status(404).json({ error: 'Invitación no válida' });

  if (event.status === 'cancelled') {
    return res.status(400).json({ error: 'Este evento ha sido cancelado' });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user
    ? parseInt((session.user as any).id as string, 10) || undefined
    : undefined;

  // If user is already a participant, return their data
  if (userId) {
    const existing = await getParticipantByUserId(event.id, userId);
    if (existing) {
      return res.status(200).json({ event, participant: existing, already_joined: true });
    }
  }

  const result = joinSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: result.error.flatten() });
  }

  // Anonymous joiners must supply an email (enforced client-side too); logged-in
  // joiners get theirs from the session regardless of what the client sent.
  const email = userId ? session?.user?.email ?? result.data.email : result.data.email;
  if (!email) {
    return res.status(400).json({ error: 'El email es obligatorio' });
  }

  const participant = await addParticipant({
    event_id: event.id,
    user_id: userId,
    name: result.data.name,
    email,
    role: 'participant',
  });

  return res.status(201).json({ event, participant });
}
