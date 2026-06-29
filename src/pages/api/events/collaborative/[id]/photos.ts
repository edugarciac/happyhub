// src/pages/api/events/collaborative/[id]/photos.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

const addPhotoSchema = z.object({
  url: z.string().url().max(500),
  caption: z.string().max(255).optional().nullable(),
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
      `SELECT * FROM event_photos WHERE event_id = $1 ORDER BY created_at DESC`,
      [eventId]
    );
    return res.status(200).json({ photos: result.rows });
  }

  if (req.method === 'POST') {
    const parsed = addPhotoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { url, caption } = parsed.data;
    const result = await query(
      `INSERT INTO event_photos (event_id, uploaded_by_participant_id, url, caption)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [eventId, participant?.id ?? null, url, caption ?? null]
    );
    return res.status(201).json({ photo: result.rows[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
