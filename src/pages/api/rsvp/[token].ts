import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { query } from '@/lib/db';

const updateSchema = z.object({
  status: z.enum(['confirmed', 'declined', 'maybe']),
  note: z.string().max(500).optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.query.token as string;
  if (!token || token.length !== 64) return res.status(400).json({ error: 'Token inválido' });

  const result = await query(
    `SELECT p.*, e.title, e.event_date, e.event_time, e.location, e.cover_image_url
     FROM collaborative_event_participants p
     JOIN collaborative_events e ON e.id = p.event_id
     WHERE p.invite_token = $1`,
    [token]
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Enlace no válido o expirado' });

  const row = result.rows[0];
  const participant = {
    id: row.id,
    name: row.name,
    rsvp_status: row.rsvp_status,
    rsvp_note: row.rsvp_note,
  };
  const event = {
    id: row.event_id,
    title: row.title,
    event_date: row.event_date,
    event_time: row.event_time,
    location: row.location,
    cover_image_url: row.cover_image_url,
  };

  if (req.method === 'GET') {
    return res.status(200).json({ participant, event });
  }

  if (req.method === 'POST') {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    await query(
      `UPDATE collaborative_event_participants
       SET rsvp_status = $1, rsvp_note = $2
       WHERE invite_token = $3`,
      [parsed.data.status, parsed.data.note ?? null, token]
    );

    return res.status(200).json({ updated: true, status: parsed.data.status });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
