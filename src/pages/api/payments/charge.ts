import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';
import { ensureReservationChargesTable, getChargeReservation } from '@/lib/reservationCharges';
import { buildReservationCode } from '@/utils/reservationCode';
import { chargeConceptLabel } from '@/utils/charges';

/** Sesión de Stripe para pagar un cobro adicional desde su enlace (sin cuenta) */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Falta el enlace de pago' });

  try {
    await ensureReservationChargesTable();
    const charge = await queryOne<{ id: number; reservation_id: number; concept: string; hours: number | null; description: string; amount: string }>(
      `SELECT id, reservation_id, concept, hours, description, amount FROM reservation_charges
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );
    if (!charge) return res.status(404).json({ error: 'Este enlace de pago no es válido, ya está pagado o ha caducado' });

    const reservation = await getChargeReservation(charge.reservation_id);
    if (!reservation || ['cancelled', 'rejected'].includes(reservation.status)) {
      return res.status(400).json({ error: 'Esta reserva está cancelada' });
    }

    const code = buildReservationCode(reservation.event_date, reservation.id);
    const concept = chargeConceptLabel(charge);
    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;
    const session = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: concept, description: `Reserva ${code}` },
            unit_amount: Math.round(parseFloat(charge.amount) * 100),
          },
          quantity: 1,
        },
      ],
      successUrl: `${baseUrl}/pagar/cargo/${token}?ok=1`,
      cancelUrl: `${baseUrl}/pagar/cargo/${token}`,
      customerEmail: reservation.email || undefined,
      metadata: { type: 'extra_charge', chargeId: String(charge.id), reservationId: code },
      description: `${concept} - Reserva ${code}`,
    });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating extra charge checkout:', error);
    return res.status(500).json({ error: 'No se ha podido iniciar el pago. Inténtalo de nuevo.' });
  }
}
