// src/pages/api/events/collaborative/[id]/regalo/items/[itemId].ts
import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, parseIntParam } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, participant, isOrganizer } = ctx;

  const itemId = parseIntParam(req.query.itemId);
  if (itemId === null) return res.status(400).json({ error: 'ID inválido' });

  const itemResult = await query(
    `SELECT * FROM event_gift_items WHERE id = $1 AND event_id = $2`,
    [itemId, eventId]
  );
  const item = itemResult.rows[0];
  if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });

  const isAdder = participant && item.added_by_participant_id === participant.id;
  if (!isAdder && !isOrganizer) return res.status(403).json({ error: 'Sin permisos para eliminar este ítem' });

  await query(`DELETE FROM event_gift_items WHERE id = $1`, [itemId]);
  return res.status(200).json({ deleted: true });
});
