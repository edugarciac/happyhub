import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const guestId = parseInt(req.query.guestId as string, 10);
  if (isNaN(eventId) || isNaN(guestId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Solo el organizador puede eliminar invitados' });

  const existing = await query(
    `SELECT id FROM collaborative_event_participants WHERE id = $1 AND event_id = $2`,
    [guestId, eventId]
  );
  if (!existing.rows.length) return res.status(404).json({ error: 'Invitado no encontrado' });

  await query(`DELETE FROM collaborative_event_participants WHERE id = $1`, [guestId]);
  return res.status(200).json({ deleted: true });
}
