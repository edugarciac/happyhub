import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { z } from 'zod';
import { query } from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

const resendSchema = z.object({ guestId: z.number().int() });

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, event, isOrganizer } = ctx;
  if (!isOrganizer) return res.status(403).json({ error: 'Sin permisos' });

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
});
