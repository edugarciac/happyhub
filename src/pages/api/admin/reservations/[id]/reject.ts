import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { queryOne } from '../../../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface RejectResponse {
  success: boolean;
  reservation?: any;
  error?: string;
}

interface DecodedToken {
  userId: number;
  email: string;
  role: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RejectResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 3.2: Check JWT authentication and verify role='admin'
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
    }

    const token = authHeader.substring(7);
    let decoded: DecodedToken;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
      });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden rechazar reservas',
      });
    }

    const { id } = req.query;
    const { rejection_reason } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de reserva inválido',
      });
    }

    // 3.3: Validate rejection_reason is provided
    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El motivo de rechazo es obligatorio',
      });
    }

    const reservationId = parseInt(id);

    // 3.4: Validate reservation exists and status='pending'
    const reservation = await queryOne<{
      id: number;
      status: string;
      user_id: number;
    }>(
      'SELECT id, status, user_id FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada',
      });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Esta reserva ya fue procesada (status: ${reservation.status})`,
      });
    }

    // 3.5: Update reservation to rejected
    const updated = await queryOne(
      `UPDATE reservations
       SET status = 'rejected',
           rejection_reason = $1,
           admin_approved_by = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [rejection_reason.trim(), decoded.email, reservationId]
    );

    // Trigger n8n notification workflow
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
        }, {
          timeout: 5000,
        }).catch(err => {
          console.error('n8n notification failed (non-blocking):', err.message);
        });
      }
    } catch (err) {
      console.error('n8n webhook call failed (non-blocking):', err);
    }

    // 3.6: Return success with updated data
    return res.status(200).json({
      success: true,
      reservation: updated,
    });
  } catch (error) {
    console.error('Error rejecting reservation:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al rechazar la reserva',
    });
  }
}
