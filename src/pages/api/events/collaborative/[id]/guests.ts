import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

const addGuestSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional().nullable(),
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
      `SELECT * FROM collaborative_event_participants WHERE event_id = $1 ORDER BY joined_at ASC`,
      [eventId]
    );
    return res.status(200).json({ guests: result.rows });
  }

  if (req.method === 'POST') {
    if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede añadir invitados' });

    const parsed = addGuestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { name, email } = parsed.data;
    const invite_token = crypto.randomBytes(32).toString('hex');

    const result = await query(
      `INSERT INTO collaborative_event_participants
         (event_id, name, email, role, rsvp_status, invite_token, invited_at)
       VALUES ($1, $2, $3, 'participant', 'pending', $4, $5)
       RETURNING *`,
      [eventId, name, email ?? null, invite_token, email ? new Date().toISOString() : null]
    );
    const guest = result.rows[0];

    if (email) {
      await sendInvitationEmail(
        email, name, event.title, event.event_date, event.location, invite_token
      );
    }

    return res.status(201).json({ guest });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
