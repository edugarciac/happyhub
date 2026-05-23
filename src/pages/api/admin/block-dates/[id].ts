import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const { reason } = req.body as { reason?: string };

  const updated = await queryOne<{
    id: number;
    slot_date: string;
    time_slot: string;
    reason: string | null;
  }>(
    `UPDATE blocked_slots
     SET reason = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, time_slot, reason`,
    [reason ?? null, parseInt(id)]
  );

  if (!updated) {
    return res.status(404).json({ error: 'No encontrado' });
  }

  return res.status(200).json({
    updated: {
      id: updated.id,
      date: updated.slot_date,
      timeSlot: updated.time_slot,
      reason: updated.reason,
    },
  });
}
