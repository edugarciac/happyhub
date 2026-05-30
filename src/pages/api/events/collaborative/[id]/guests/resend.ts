import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

const resendSchema = z.object({ guestId: z.number().int() });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Sin permisos' });

  const parsed = resendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const guestResult = await query(
    `SELECT * FROM collaborative_event_participants WHERE id = $1 AND event_id = $2`,
    [parsed.data.guestId, eventId]
  );
  const guest = guestResult.rows[0];
  if (!guest) return res.status(404).json({ error: 'Invitado no encontrado' });
  if (!guest.email) return res.status(400).json({ error: 'Este invitado no tiene email' });

  let token = guest.invite_token;
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    await query(
      `UPDATE collaborative_event_participants SET invite_token = $1, invited_at = NOW() WHERE id = $2`,
      [token, guest.id]
    );
  } else {
    await query(
      `UPDATE collaborative_event_participants SET invited_at = NOW() WHERE id = $1`,
      [guest.id]
    );
  }

  await sendInvitationEmail(
    guest.email, guest.name, event.title, event.event_date, event.location, token
  );

  return res.status(200).json({ sent: true });
}
