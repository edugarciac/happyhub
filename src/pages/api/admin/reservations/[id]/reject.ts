import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { queryOne } from '../../../../../lib/db';
import { verifyAdminSession } from '../../../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdminSession(req, res);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const { id } = req.query;
    const { rejection_reason } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
    }

    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({ success: false, error: 'El motivo de rechazo es obligatorio' });
    }

    const reservationId = parseInt(id);

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

    // Trigger n8n notification (non-blocking)
    try {
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (n8nUrl) {
        await axios.post(`${n8nUrl}/reservation-status-changed`, {
          reservation_id: reservationId,
          status: 'rejected',
          customer_email: updated.user_email,
          customer_phone: updated.user_phone,
          customer_name: updated.user_name,
          rejection_reason: rejection_reason.trim(),
        }, { timeout: 5000 }).catch(err => console.error('n8n notification failed:', err.message));
      }
    } catch (err) {
      console.error('n8n webhook failed:', err);
    }

    return res.status(200).json({ success: true, reservation: updated });
  } catch (error) {
    console.error('Error rejecting reservation:', error);
    return res.status(500).json({ success: false, error: 'Error al rechazar la reserva' });
  }
}
