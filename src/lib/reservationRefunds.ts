import Stripe from 'stripe';
import { query, queryOne } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { ensureReservationChargesTable } from '@/lib/reservationCharges';
import { chargeConceptLabel } from '@/utils/charges';
import { daysUntilEvent, isFullRefundEligible } from '@/utils/cancellationPolicy';
import { REMAINING_PAYMENT_METHOD_LABELS } from '@/utils/reservationStatus';
import { getAdminEmails, sendEmail } from '@/lib/mailer';
import { buildReservationCode, manualRefundAlertEmail } from '@/lib/emailTemplates';

// Devolución de lo pagado al cancelar una reserva (política de 15 días, ver utils/cancellationPolicy)

export interface StripeRefundItem {
  label: string;
  amount: number; // € pendientes de devolver de este pago
  paymentIntentId: string;
}

export interface ManualRefundItem {
  label: string;
  amount: number;
  method: string; // 'Bizum', 'datáfono', 'efectivo'...
}

export interface RefundPlan {
  reservationId: number;
  eventDate: string;
  daysUntilEvent: number;
  eligible: boolean;
  stripe: StripeRefundItem[];
  manual: ManualRefundItem[];
  /** Fianza bloqueada en Stripe que se libera */
  stripeHold: { amount: number; paymentIntentId: string } | null;
  /** Fianza bloqueada en el datáfono: liberarla a mano */
  terminalHold: number | null;
  stripeTotal: number;
  manualTotal: number;
  alreadyRefunded: number;
  customer: { name: string | null; email: string | null; phone: string | null };
}

export interface RefundResult {
  refunded: StripeRefundItem[];
  failed: { item: StripeRefundItem; error: string }[];
  holdReleased: boolean;
  holdError: string | null;
  refundedTotal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Lo que queda por devolver (€) del pago de una sesión de Checkout, o null si la sesión no está pagada */
async function refundableFromSession(sessionId: string): Promise<{ amount: number; paymentIntentId: string } | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] });
  if (session.payment_status !== 'paid' || !session.payment_intent) return null;
  const pi = session.payment_intent as Stripe.PaymentIntent;
  const charge = pi.latest_charge && typeof pi.latest_charge !== 'string' ? pi.latest_charge : null;
  const cents = charge ? charge.amount - charge.amount_refunded : pi.amount_received;
  return { amount: Math.max(0, cents) / 100, paymentIntentId: pi.id };
}

export async function getRefundPlan(reservationId: number): Promise<RefundPlan | null> {
  await ensureReservationFlowColumns();
  await ensureReservationChargesTable();
  const r = await queryOne<{
    event_date: string;
    payment_status: string | null;
    payment_method: string | null;
    deposit_amount: string | null;
    total_price: string | null;
    stripe_deposit_session_id: string | null;
    stripe_remaining_session_id: string | null;
    remaining_payment_method: string | null;
    security_deposit_status: string | null;
    security_deposit_method: string | null;
    security_deposit_payment_intent: string | null;
    security_deposit_amount_held: string | null;
    refunded_amount: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  }>(
    `SELECT TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.payment_status, r.payment_method,
            r.deposit_amount, r.total_price, r.stripe_deposit_session_id, r.stripe_remaining_session_id,
            r.remaining_payment_method, r.security_deposit_status, r.security_deposit_method,
            r.security_deposit_payment_intent, r.security_deposit_amount_held, r.refunded_amount,
            u.name, u.email, u.phone
     FROM reservations r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = $1`,
    [reservationId]
  );
  if (!r) return null;

  const stripeItems: StripeRefundItem[] = [];
  const manual: ManualRefundItem[] = [];
  const deposit = Number(r.deposit_amount) || 0;
  const total = Number(r.total_price) || 0;
  const depositPaid = r.payment_status === 'deposit_paid' || r.payment_status === 'fully_paid';

  // Señal
  if (depositPaid) {
    const card = r.stripe_deposit_session_id ? await refundableFromSession(r.stripe_deposit_session_id) : null;
    if (card) {
      if (card.amount > 0) stripeItems.push({ label: 'Señal', ...card });
    } else if (deposit > 0) {
      manual.push({ label: 'Señal', amount: deposit, method: r.payment_method === 'bizum' ? 'Bizum' : 'a mano' });
    }
  }

  // Resto
  if (r.payment_status === 'fully_paid') {
    const card =
      r.remaining_payment_method === 'card_link' && r.stripe_remaining_session_id
        ? await refundableFromSession(r.stripe_remaining_session_id)
        : null;
    if (card) {
      if (card.amount > 0) stripeItems.push({ label: 'Resto del pago', ...card });
    } else if (total - deposit > 0) {
      manual.push({
        label: 'Resto del pago',
        amount: round2(total - deposit),
        method: REMAINING_PAYMENT_METHOD_LABELS[r.remaining_payment_method || ''] || 'a mano',
      });
    }
  }

  // Cobros adicionales pagados
  const charges = await query<{ concept: string; hours: number | null; description: string; amount: string; paid_method: string | null; stripe_session_id: string | null }>(
    `SELECT concept, hours, description, amount, paid_method, stripe_session_id
     FROM reservation_charges WHERE reservation_id = $1 AND status = 'paid' ORDER BY id`,
    [reservationId]
  );
  for (const c of charges.rows) {
    const label = `Cobro adicional: ${chargeConceptLabel(c)}`;
    const card = c.paid_method === 'card' && c.stripe_session_id ? await refundableFromSession(c.stripe_session_id) : null;
    if (card) {
      if (card.amount > 0) stripeItems.push({ label, ...card });
    } else if (Number(c.amount) > 0) {
      manual.push({ label, amount: Number(c.amount), method: c.paid_method || 'a mano' });
    }
  }

  // Fianza
  const held = r.security_deposit_status === 'held';
  const stripeHold =
    held && r.security_deposit_method === 'card_link' && r.security_deposit_payment_intent
      ? { amount: Number(r.security_deposit_amount_held) || 0, paymentIntentId: r.security_deposit_payment_intent }
      : null;
  const terminalHold = held && !stripeHold ? Number(r.security_deposit_amount_held) || 0 : null;

  return {
    reservationId,
    eventDate: r.event_date,
    daysUntilEvent: daysUntilEvent(r.event_date),
    eligible: isFullRefundEligible(r.event_date),
    stripe: stripeItems,
    manual,
    stripeHold,
    terminalHold,
    stripeTotal: round2(stripeItems.reduce((s, i) => s + i.amount, 0)),
    manualTotal: round2(manual.reduce((s, i) => s + i.amount, 0)),
    alreadyRefunded: Number(r.refunded_amount) || 0,
    customer: { name: r.name, email: r.email, phone: r.phone },
  };
}

/** Devuelve por Stripe los pagos con tarjeta del plan y libera la fianza de Stripe. Nunca lanza. */
export async function executeRefundPlan(plan: RefundPlan): Promise<RefundResult> {
  const refunded: StripeRefundItem[] = [];
  const failed: RefundResult['failed'] = [];

  for (const item of plan.stripe) {
    const cents = Math.round(item.amount * 100);
    try {
      await stripe.refunds.create(
        { payment_intent: item.paymentIntentId, amount: cents, reason: 'requested_by_customer', metadata: { reservationId: String(plan.reservationId) } },
        { idempotencyKey: `refund-${plan.reservationId}-${item.paymentIntentId}-${cents}` }
      );
      refunded.push(item);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`CRITICAL: devolución fallida de ${item.amount} EUR (${item.label}) en la reserva ${plan.reservationId}:`, error);
      failed.push({ item, error });
    }
  }

  let holdReleased = false;
  let holdError: string | null = null;
  if (plan.stripeHold) {
    try {
      const pi = await stripe.paymentIntents.retrieve(plan.stripeHold.paymentIntentId);
      if (pi.status === 'requires_capture') await stripe.paymentIntents.cancel(pi.id);
      await query(
        `UPDATE reservations SET security_deposit_status = 'released', security_deposit_resolved_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [plan.reservationId]
      );
      holdReleased = true;
    } catch (err) {
      holdError = err instanceof Error ? err.message : String(err);
      console.error(`CRITICAL: no se pudo liberar la fianza de la reserva ${plan.reservationId}:`, holdError);
    }
  }

  const refundedTotal = round2(refunded.reduce((s, i) => s + i.amount, 0));
  if (refundedTotal > 0) {
    await query(
      `UPDATE reservations SET refunded_amount = COALESCE(refunded_amount, 0) + $1, refunded_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [refundedTotal, plan.reservationId]
    ).catch((err) => console.error(`CRITICAL: devolución de ${refundedTotal} EUR hecha en Stripe pero no guardada en la reserva ${plan.reservationId}`, err));
  }

  return { refunded, failed, holdReleased, holdError, refundedTotal };
}

/** Datos de la previsualización para el panel (sin ids de Stripe) */
export function refundPlanSummary(plan: RefundPlan) {
  return {
    daysUntilEvent: plan.daysUntilEvent,
    eligible: plan.eligible,
    stripe: plan.stripe.map(({ label, amount }) => ({ label, amount })),
    manual: plan.manual,
    stripeHold: plan.stripeHold ? plan.stripeHold.amount : null,
    terminalHold: plan.terminalHold,
    stripeTotal: plan.stripeTotal,
    manualTotal: plan.manualTotal,
    alreadyRefunded: plan.alreadyRefunded,
  };
}

/** Ejecuta el plan y avisa a los admins de lo pendiente (a mano o fallido). Devuelve el resultado y un aviso para el panel. */
export async function refundAndNotify(plan: RefundPlan): Promise<{ result: RefundResult; warning?: string }> {
  const result = await executeRefundPlan(plan);
  const needsAdmin = plan.manual.length > 0 || result.failed.length > 0 || !!plan.terminalHold || !!result.holdError;
  if (needsAdmin) {
    const sent = await sendEmail({
      to: getAdminEmails(),
      ...manualRefundAlertEmail({
        code: buildReservationCode(plan.eventDate, plan.reservationId),
        customerName: plan.customer.name,
        customerPhone: plan.customer.phone,
        customerEmail: plan.customer.email,
        manual: plan.manual,
        failed: result.failed.map((f) => ({ label: f.item.label, amount: f.item.amount, error: f.error })),
        terminalHold: plan.terminalHold,
        holdError: result.holdError,
      }),
    });
    if (!sent) console.error(`CRITICAL: no se pudo enviar el aviso de devolución pendiente de la reserva ${plan.reservationId}`);
  }

  const parts: string[] = [];
  if (result.failed.length) {
    const amount = round2(result.failed.reduce((s, f) => s + f.item.amount, 0));
    parts.push(`Falló la devolución por Stripe de ${amount} €: reinténtalo con "Devolver pagos"`);
  }
  if (plan.manual.length) parts.push(`Devuelve a mano ${plan.manualTotal} € (${plan.manual.map((m) => m.method).join(', ')})`);
  if (plan.terminalHold) parts.push('Libera la fianza en el datáfono');
  if (result.holdError) parts.push('No se pudo liberar la fianza en Stripe');
  return { result, warning: parts.length ? parts.join('. ') : undefined };
}
