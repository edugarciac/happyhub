import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { z } from 'zod';
import { query } from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

const importSchema = z.object({
  rows: z.array(z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().nullable(),
  })).min(1).max(500),
});

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, event, isOrganizer } = ctx;
  if (!isOrganizer) return res.status(403).json({ error: 'Sin permisos' });

  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let imported = 0;
  const errors: string[] = [];

  for (const row of parsed.data.rows) {
    try {
      const invite_token = crypto.randomBytes(32).toString('hex');
      await query(
        `INSERT INTO collaborative_event_participants
           (event_id, name, email, role, rsvp_status, invite_token, invited_at)
         VALUES ($1, $2, $3, 'participant', 'pending', $4, $5)
         ON CONFLICT DO NOTHING`,
        [eventId, row.name, row.email, invite_token, row.email ? new Date().toISOString() : null]
      );
      if (row.email) {
        await sendInvitationEmail(
          row.email, row.name, event.title, event.event_date, event.location ?? null, invite_token
        );
      }
      imported++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      errors.push(`${row.name}: ${message}`);
    }
  }

  return res.status(200).json({ imported, errors });
});
