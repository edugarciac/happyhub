import { queryOne } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { buildReservationCode, reservationCustomerEmail, EVENT_TYPE_LABELS } from '@/lib/emailTemplates';
import { createReservationEvent } from '@/lib/googleCalendar';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { extraHoursPrice, slotEndTime } from '@/utils/pricing';
import { parseReservationExtras } from '@/lib/reservationExtras';

export interface RequestNotificationResult {
  /** No hay email de cliente: no se ha enviado nada */
  noEmail?: boolean;
  emailSent: boolean;
  calendarEventCreated: boolean;
}

/**
 * Envía al cliente el correo de "Solicitud de reserva" (el mismo que la reserva web) y crea el evento
 * [PENDIENTE] en Google Calendar si aún no existe. Para reservas creadas desde el panel admin. Nunca lanza.
 * Con `sendEmail: false` solo crea el evento de Calendar.
 */
export async function sendReservationRequestNotifications(
  reservationId: number,
  options: { sendEmail?: boolean } = {}
): Promise<RequestNotificationResult> {
  const shouldSendEmail = options.sendEmail !== false;
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
      extras: unknown;
      notes: string | null;
      google_calendar_event_id: string | null;
      name: string | null;
      email: string | null;
      phone: string | null;
    }>(
      `SELECT TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot, r.event_type, r.guests,
              r.total_price, r.deposit_amount, r.payment_method, r.extra_hours, r.extras, r.notes,
              r.google_calendar_event_id, u.name, u.email, u.phone
       FROM reservations r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
      [reservationId]
    );
    if (!r) return { emailSent: false, calendarEventCreated: false };

    const code = buildReservationCode(r.event_date, reservationId);
    const extraHours = Number(r.extra_hours) || 0;
    const extras = parseReservationExtras(r.extras);
    const totalPrice = Number(r.total_price) || 0;
    const depositAmount = Number(r.deposit_amount) || 0;
    const eventType = r.event_type || 'otros';
    const paymentMethod = r.payment_method || 'card';

    const [emailSent, calendarEventId] = await Promise.all([
      r.email && shouldSendEmail
        ? sendEmail({
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
        : Promise.resolve(false),
      r.google_calendar_event_id
        ? Promise.resolve(null)
        : createReservationEvent({
            date: r.event_date,
            timeSlot: r.time_slot,
            extraHours,
            summary: `[PENDIENTE] ${EVENT_TYPE_LABELS[eventType] || eventType} - ${r.name || 'Cliente'}`,
            description: [
              `Reserva: ${code} (manual)`,
              `Nombre: ${r.name || ''}`,
              r.phone ? `Teléfono: ${r.phone}` : '',
              r.email ? `Email: ${r.email}` : '',
              `Invitados: ${Number(r.guests) || 0}`,
              extraHours > 0 ? `Horas adicionales: ${extraHours} (${extraHoursPrice(extraHours)} €), hasta las ${slotEndTime('afternoon', extraHours)}h` : '',
              extras.length > 0 ? `Servicios: ${extras.map((e) => `${e.title} (${e.price} €)`).join(', ')}` : '',
              `Total: ${totalPrice} € (señal ${depositAmount} €)`,
              r.notes ? `Notas: ${r.notes}` : '',
            ].filter(Boolean).join('\n'),
          }),
    ]);

    if (calendarEventId) {
      await queryOne('UPDATE reservations SET google_calendar_event_id = $1 WHERE id = $2', [calendarEventId, reservationId]).catch(
        (err) => console.error('Error guardando google_calendar_event_id:', err)
      );
    }

    return { noEmail: !r.email, emailSent, calendarEventCreated: !!calendarEventId };
  } catch (err) {
    console.error('[reservationNotifications] Error notifying reservation', reservationId, err);
    return { emailSent: false, calendarEventCreated: false };
  }
}
