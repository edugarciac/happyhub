import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';

// El admin registra que ha cobrado el resto en el datáfono el día del evento (no se admite Bizum para el resto).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }
  const id = Number.parseInt(String(req.query.id), 10);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
  }
  try {
    await ensureReservationFlowColumns();
    const updated = await queryOne(
      `UPDATE reservations
       SET deposit_paid = total_price, payment_status = 'fully_paid', remaining_payment_method = 'terminal', updated_at = NOW()
       WHERE id = $1 AND payment_status = 'deposit_paid' AND status NOT IN ('cancelled', 'rejected')
       RETURNING id`,
      [id]
    );
    if (!updated) {
      return res.status(400).json({ success: false, error: 'Solo se puede registrar en reservas con la señal pagada y el resto pendiente' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking remaining as paid:', error);
    return res.status(500).json({ success: false, error: 'Error al registrar el cobro' });
  }
}
