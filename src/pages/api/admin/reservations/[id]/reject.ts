import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { parseIntParam, notifyN8n } from '@/lib/apiMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdminSession(req, res);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const { rejection_reason } = req.body;

    const reservationId = parseIntParam(req.query.id);
    if (reservationId === null) {
      return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
    }

    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({ success: false, error: 'El motivo de rechazo es obligatorio' });
    }

    const reservation = await queryOne<{ id: number; status: string }>(
      'SELECT id, status FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Esta reserva ya fue procesada (status: ${reservation.status})` });
    }

    const updated = await queryOne(
      `UPDATE reservations
       SET status = 'rejected',
           rejection_reason = $1,
           admin_approved_by = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [rejection_reason.trim(), admin.email, reservationId]
    );

    await notifyN8n('/reservation-status-changed', {
      reservation_id: reservationId,
      status: 'rejected',
      customer_email: updated?.user_email,
      customer_phone: updated?.user_phone,
      customer_name: updated?.user_name,
      rejection_reason: rejection_reason.trim(),
    });

    return res.status(200).json({ success: true, reservation: updated });
  } catch (error) {
    console.error('Error rejecting reservation:', error);
    return res.status(500).json({ success: false, error: 'Error al rechazar la reserva' });
  }
}
