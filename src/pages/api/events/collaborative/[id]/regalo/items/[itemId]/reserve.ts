import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, parseIntParam } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, participant, isOrganizer } = ctx;

  const itemId = parseIntParam(req.query.itemId);
  if (itemId === null) return res.status(400).json({ error: 'ID inválido' });

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
    // Libre — cualquier participante puede reservar (no el organizador puro)
    if (!participant) {
      return res.status(400).json({ error: 'El organizador debe ser también invitado para reservar ítems' });
    }
    const result = await query(
      `UPDATE event_gift_items SET reserved_by_participant_id = $1, reserved_at = NOW() WHERE id = $2 RETURNING *`,
      [participant.id, itemId]
    );
    return res.status(200).json({ item: result.rows[0], action: 'reserved' });
  }
});
