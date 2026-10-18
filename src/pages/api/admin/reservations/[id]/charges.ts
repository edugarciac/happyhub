import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudit } from '@/lib/audit';
import { query } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { createReservationCharge, ensureReservationChargesTable, listReservationCharges } from '@/lib/reservationCharges';
import { validateChargeInput } from '@/utils/charges';

/**
 * Cobros adicionales de una reserva:
 *  GET   → lista
 *  POST  → crea el cobro y envía el enlace de pago al email de la reserva
 *  PATCH → { chargeId, action: 'cancel' | 'mark_paid', method? } sobre un cobro pendiente
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdminSession(req, res);
  if (!admin) return res.status(401).json({ success: false, error: 'No autorizado' });

  const reservationId = parseInt(String(req.query.id));
  if (!reservationId) return res.status(400).json({ success: false, error: 'ID de reserva inválido' });

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, charges: await listReservationCharges(reservationId) });
    }

    if (req.method === 'POST') {
      const input = validateChargeInput(req.body);
      if (!input.ok) return res.status(400).json({ success: false, error: input.error });
      const result = await createReservationCharge(reservationId, input.value, admin.email);
      if ('error' in result) return res.status(result.status).json({ success: false, error: result.error });
      const emailWarning = result.noEmail
        ? 'La reserva no tiene email: copia el enlace y envíaselo al cliente.'
        : result.emailSent
          ? undefined
          : 'Cobro creado, pero no se pudo enviar el correo. Copia el enlace y envíaselo al cliente.';
      return res.status(201).json({ success: true, charge: result.charge, emailSent: result.emailSent, ...(emailWarning ? { emailWarning } : {}) });
    }

    if (req.method === 'PATCH') {
      const { chargeId, action, method } = req.body || {};
      if (!['cancel', 'mark_paid'].includes(action)) return res.status(400).json({ success: false, error: 'Acción no válida' });
      await ensureReservationChargesTable();
      const updated =
        action === 'cancel'
          ? await query(
              `UPDATE reservation_charges SET status = 'cancelled' WHERE id = $1 AND reservation_id = $2 AND status = 'pending' RETURNING id`,
              [chargeId, reservationId]
            )
          : await query(
              `UPDATE reservation_charges SET status = 'paid', paid_at = NOW(), paid_method = $3
               WHERE id = $1 AND reservation_id = $2 AND status = 'pending' RETURNING id`,
              [chargeId, reservationId, ['bizum', 'cash', 'transfer', 'card'].includes(method) ? method : 'manual']
            );
      if (updated.rows.length === 0) {
        return res.status(409).json({ success: false, error: 'El cobro no existe o ya no está pendiente' });
      }
      return res.status(200).json({ success: true, charges: await listReservationCharges(reservationId) });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in reservation charges API:', error);
    return res.status(500).json({ success: false, error: `Error en los cobros adicionales: ${error?.message || error}` });
  }
}

export default withAudit('reservation.admin', handler, { methods: ['POST', 'PATCH'] });
