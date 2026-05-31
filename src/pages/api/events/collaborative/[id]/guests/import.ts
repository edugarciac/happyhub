import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

const importSchema = z.object({
  rows: z.array(z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().nullable(),
  })).min(1).max(500),
});

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
}
