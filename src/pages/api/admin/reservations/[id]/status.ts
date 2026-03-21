import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '../../../../../lib/db';
import { verifyAdminToken } from '../../../../../utils/adminAuth';
import { isValidTransition, ReservationStatus } from '../../../../../utils/reservationStatus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const admin = verifyAdminToken(req);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'ID de reserva invalido' });
  }

  const { status, cancellationReason } = req.body as { status: ReservationStatus; cancellationReason?: string };
  if (!status) {
    return res.status(400).json({ success: false, error: 'Se requiere el campo status' });
  }

  if (status === 'cancelled' && !cancellationReason) {
    return res.status(400).json({ success: false, error: 'Se requiere un motivo de cancelación' });
  }

  try {
    const reservation = await queryOne<{ id: number; status: ReservationStatus }>(
      'SELECT id, status FROM reservations WHERE id = $1',
      [parseInt(id)]
    );

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    if (!isValidTransition(reservation.status, status)) {
      return res.status(400).json({
        success: false,
        error: 'Transicion de estado no permitida',
      });
    }

    const updated = status === 'cancelled'
      ? await queryOne(
          `UPDATE reservations SET status = $1, cancellation_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
          [status, cancellationReason, parseInt(id)]
        )
      : await queryOne(
          `UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
          [status, parseInt(id)]
        );

    return res.status(200).json({ success: true, reservation: updated });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    return res.status(500).json({ success: false, error: 'Error al cambiar el estado' });
  }
}
