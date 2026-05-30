import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const itemId = parseInt(req.query.itemId as string, 10);
  if (isNaN(eventId) || isNaN(itemId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const itemResult = await query(
    `SELECT * FROM event_gift_items WHERE id = $1 AND event_id = $2`,
    [itemId, eventId]
  );
  const item = itemResult.rows[0];
  if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });

  if (item.reserved_by_participant_id !== null) {
    // Ya reservado — solo puede liberar quien lo reservó o el organizador
    const isReserver = participant && item.reserved_by_participant_id === participant.id;
    if (!isReserver && !isOrganizer) {
      return res.status(403).json({ error: 'Este ítem ya está reservado por otro invitado' });
    }
    const result = await query(
      `UPDATE event_gift_items SET reserved_by_participant_id = NULL, reserved_at = NULL WHERE id = $1 RETURNING *`,
      [itemId]
    );
    return res.status(200).json({ item: result.rows[0], action: 'released' });
  } else {
    // Libre — cualquier participante puede reservar
    const result = await query(
      `UPDATE event_gift_items SET reserved_by_participant_id = $1, reserved_at = NOW() WHERE id = $2 RETURNING *`,
      [participant?.id ?? null, itemId]
    );
    return res.status(200).json({ item: result.rows[0], action: 'reserved' });
  }
}
