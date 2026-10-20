import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { parseIntParam } from '@/lib/apiMiddleware';
import { getRefundPlan, refundAndNotify, refundPlanSummary } from '@/lib/reservationRefunds';
import { sendEmail } from '@/lib/mailer';
import { buildReservationCode, refundIssuedEmail } from '@/lib/emailTemplates';

/**
 * GET: lo pagado que se devolvería al cancelar (para la ventana de cancelación).
 * POST: devolver ahora lo pendiente de una reserva ya cancelada (reintento o devolución posterior).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }
  const id = parseIntParam(req.query.id);
  if (id === null) {
    return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
  }

  try {
    if (req.method === 'POST') {
      const r = await queryOne<{ status: string }>('SELECT status FROM reservations WHERE id = $1', [id]);
      if (!r) return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
      if (r.status !== 'cancelled') {
        return res.status(400).json({ success: false, error: 'Solo se puede devolver lo pagado en reservas canceladas' });
      }
    }

    const plan = await getRefundPlan(id);
    if (!plan) return res.status(404).json({ success: false, error: 'Reserva no encontrada' });

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, plan: refundPlanSummary(plan) });
    }

    if (plan.stripeTotal === 0 && !plan.stripeHold && plan.manual.length === 0) {
      return res.status(400).json({ success: false, error: 'No queda nada por devolver en esta reserva' });
    }
    const { result, warning } = await refundAndNotify(plan);
    console.log(`Devolución manual de la reserva ${id} por ${admin.email}: ${result.refundedTotal} EUR`);

    // Avisar al cliente de lo devuelto y de lo que se le devolverá a mano
    let customerWarning: string | undefined;
    if ((result.refundedTotal > 0 || plan.manual.length > 0) && plan.customer.email) {
      const sent = await sendEmail({
        to: plan.customer.email,
        ...refundIssuedEmail({
          name: plan.customer.name || '',
          code: buildReservationCode(plan.eventDate, id),
          date: plan.eventDate,
          refund: { card: result.refundedTotal, manual: plan.manual.map((m) => ({ amount: m.amount, method: m.method })) },
        }),
      });
      if (!sent) customerWarning = 'No se pudo enviar el email de devolución al cliente';
    } else if (result.refundedTotal > 0 || plan.manual.length > 0) {
      customerWarning = 'La reserva no tiene email: avisa al cliente de la devolución a mano';
    }
    return res.status(200).json({ success: true, refunded: result.refundedTotal, warning: [warning, customerWarning].filter(Boolean).join('. ') || undefined });
  } catch (error) {
    console.error('Error en la devolución de la reserva:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar o hacer la devolución' });
  }
}
