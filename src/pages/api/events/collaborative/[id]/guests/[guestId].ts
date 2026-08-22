import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, parseIntParam } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, isOrganizer } = ctx;
  if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede eliminar invitados' });

  const guestId = parseIntParam(req.query.guestId);
  if (guestId === null) return res.status(400).json({ error: 'ID inválido' });

  const existing = await query(
    `SELECT id FROM collaborative_event_participants WHERE id = $1 AND event_id = $2`,
    [guestId, eventId]
  );
  if (!existing.rows.length) return res.status(404).json({ error: 'Invitado no encontrado' });

  await query(`DELETE FROM collaborative_event_participants WHERE id = $1`, [guestId]);
  return res.status(200).json({ deleted: true });
});
