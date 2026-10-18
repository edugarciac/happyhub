import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { MANUAL_FULL_PAYMENT_METHODS } from '@/utils/reservationStatus';

// El admin registra a mano el pago total (resto cobrado en datáfono, efectivo o transferencia).
// El pago del resto con tarjeta por enlace/QR lo registra el webhook de Stripe.
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
  const method = req.body?.method ?? 'terminal';
  if (!(MANUAL_FULL_PAYMENT_METHODS as readonly string[]).includes(method)) {
    return res.status(400).json({ success: false, error: 'Método de pago no válido' });
  }
  try {
    await ensureReservationFlowColumns();
    const updated = await queryOne(
      `UPDATE reservations
       SET deposit_paid = total_price, payment_status = 'fully_paid', remaining_payment_method = $2, updated_at = NOW()
       WHERE id = $1 AND status = 'confirmed' AND COALESCE(payment_status, 'pending') <> 'fully_paid'
       RETURNING id`,
      [id, method]
    );
    if (!updated) {
      return res.status(400).json({ success: false, error: 'Solo se puede marcar el pago total en reservas con la señal pagada y el resto pendiente' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking remaining as paid:', error);
    return res.status(500).json({ success: false, error: 'Error al registrar el cobro' });
  }
}
