import { queryOne } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { buildReservationCode, reservationCustomerEmail } from '@/lib/emailTemplates';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';

export interface RequestNotificationResult {
  /** No hay email de cliente: no se ha enviado nada */
  noEmail?: boolean;
  emailSent: boolean;
}

/**
 * Envía al cliente el correo de "Solicitud de reserva" (el mismo que la reserva web).
 * Para reservas creadas desde el panel admin. Nunca lanza.
 */
export async function sendReservationRequestNotifications(
  reservationId: number
): Promise<RequestNotificationResult> {
  try {
    await ensureReservationFlowColumns();
    const r = await queryOne<{
      event_date: string;
      time_slot: string;
      event_type: string | null;
      guests: number | null;
      total_price: string | null;
      deposit_amount: string | null;
      payment_method: string | null;
      extra_hours: number | null;
      notes: string | null;
      name: string | null;
      email: string | null;
      phone: string | null;
    }>(
      `SELECT TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot, r.event_type, r.guests,
              r.total_price, r.deposit_amount, r.payment_method, r.extra_hours, r.notes,
              u.name, u.email, u.phone
       FROM reservations r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
      [reservationId]
    );
    if (!r) return { emailSent: false };

    const code = buildReservationCode(r.event_date, reservationId);
    const extraHours = Number(r.extra_hours) || 0;
    const totalPrice = Number(r.total_price) || 0;
    const depositAmount = Number(r.deposit_amount) || 0;
    const eventType = r.event_type || 'otros';
    const paymentMethod = r.payment_method || 'card';

    const emailSent =
      r.email
        ? await sendEmail({
            to: r.email,
            ...reservationCustomerEmail({
              code,
              name: r.name || '',
              email: r.email,
              phone: r.phone || '',
              date: r.event_date,
              timeSlot: r.time_slot,
              guests: Number(r.guests) || 0,
              extraHours,
              eventType,
              paymentMethod,
              totalPrice,
              depositAmount,
              dbId: reservationId,
            }),
          })
        : false;

    return { noEmail: !r.email, emailSent };
  } catch (err) {
    console.error('[reservationNotifications] Error notifying reservation', reservationId, err);
    return { emailSent: false };
  }
}
