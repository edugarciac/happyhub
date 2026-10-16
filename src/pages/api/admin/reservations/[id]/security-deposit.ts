import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { verifyAdminSession } from '@/utils/adminAuth';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { SECURITY_DEPOSIT_AMOUNT, SECURITY_DEPOSIT_TERMINAL_HOLD_DAYS } from '@/config/payments';

/**
 * Gestión de la fianza (preautorización de 150 €) desde el panel:
 *  - record_terminal: se ha bloqueado en el datáfono (fuera del sistema)
 *  - release:         liberar el bloqueo (Stripe: cancela la autorización; datáfono: solo registra)
 *  - capture:         cobrar daños, hasta el importe bloqueado (Stripe: captura parcial y libera el resto)
 */
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

  const { action, amount, note } = req.body as { action?: string; amount?: number; note?: string };
  const cleanNote = typeof note === 'string' ? note.slice(0, 1000) : null;

  try {
    await ensureReservationFlowColumns();
    const r = await queryOne<{
      security_deposit_status: string | null;
      security_deposit_method: string | null;
      security_deposit_payment_intent: string | null;
      security_deposit_amount_held: string | null;
    }>(
      `SELECT security_deposit_status, security_deposit_method, security_deposit_payment_intent, security_deposit_amount_held
       FROM reservations WHERE id = $1`,
      [id]
    );
    if (!r) return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    const status = r.security_deposit_status || 'none';

    if (action === 'record_terminal') {
      if (status === 'held') return res.status(400).json({ success: false, error: 'La fianza ya está bloqueada' });
      await queryOne(
        `UPDATE reservations
         SET security_deposit_status = 'held', security_deposit_method = 'terminal',
             security_deposit_payment_intent = NULL, security_deposit_amount_held = $1,
             security_deposit_held_at = NOW(),
             security_deposit_expires_at = NOW() + ($2 || ' days')::interval,
             security_deposit_captured = NULL, security_deposit_resolved_at = NULL,
             security_deposit_note = $3, updated_at = NOW()
         WHERE id = $4`,
        [SECURITY_DEPOSIT_AMOUNT, String(SECURITY_DEPOSIT_TERMINAL_HOLD_DAYS), cleanNote, id]
      );
      return res.status(200).json({
        success: true,
        message: `Fianza registrada en datáfono. Recuerda: en datáfono el bloqueo suele durar solo ${SECURITY_DEPOSIT_TERMINAL_HOLD_DAYS} días (Visa ~5). Libérala o cóbrala desde el terminal.`,
      });
    }

    if (status !== 'held') {
      return res.status(400).json({ success: false, error: 'No hay ninguna fianza bloqueada en esta reserva' });
    }
    const held = parseFloat(r.security_deposit_amount_held || String(SECURITY_DEPOSIT_AMOUNT));
    const isStripe = r.security_deposit_method === 'card_link' && !!r.security_deposit_payment_intent;

    if (action === 'release') {
      if (isStripe) {
        const pi = await stripe.paymentIntents.retrieve(r.security_deposit_payment_intent!);
        if (pi.status === 'requires_capture') {
          await stripe.paymentIntents.cancel(pi.id);
        } else if (pi.status === 'canceled') {
          // ya caducada o liberada en Stripe: solo se refleja
        } else {
          return res.status(400).json({ success: false, error: `Stripe indica un estado inesperado: ${pi.status}` });
        }
      }
      await queryOne(
        `UPDATE reservations
         SET security_deposit_status = 'released', security_deposit_resolved_at = NOW(),
             security_deposit_note = COALESCE($1, security_deposit_note), updated_at = NOW()
         WHERE id = $2`,
        [cleanNote, id]
      );
      return res.status(200).json({
        success: true,
        message: isStripe ? 'Fianza liberada. El banco del cliente puede tardar unos días en reflejarlo.' : 'Fianza marcada como liberada. Libérala también en el datáfono.',
      });
    }

    if (action === 'capture') {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0 || value > held) {
        return res.status(400).json({ success: false, error: `El importe debe estar entre 0,01 y ${held} €` });
      }
      if (!cleanNote || cleanNote.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'Describe los daños (se guardan como justificación)' });
      }
      if (isStripe) {
        const pi = await stripe.paymentIntents.retrieve(r.security_deposit_payment_intent!);
        if (pi.status !== 'requires_capture') {
          return res.status(400).json({
            success: false,
            error: pi.status === 'canceled' ? 'El bloqueo ya ha caducado o se ha liberado: no se puede cobrar desde aquí' : `Estado inesperado en Stripe: ${pi.status}`,
          });
        }
        await stripe.paymentIntents.capture(pi.id, { amount_to_capture: Math.round(value * 100) });
      }
      await queryOne(
        `UPDATE reservations
         SET security_deposit_status = 'captured', security_deposit_captured = $1,
             security_deposit_resolved_at = NOW(), security_deposit_note = $2, updated_at = NOW()
         WHERE id = $3`,
        [value, cleanNote, id]
      );
      return res.status(200).json({
        success: true,
        message: isStripe
          ? `Cobrados ${value} € de la fianza; el resto se libera automáticamente. Envía al cliente las fotos y la explicación.`
          : `Registrados ${value} € cobrados. Haz el cobro en el datáfono y envía al cliente las fotos y la explicación.`,
      });
    }

    return res.status(400).json({ success: false, error: 'Acción no válida' });
  } catch (error: any) {
    console.error('Error gestionando la fianza:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Error al gestionar la fianza' });
  }
}
