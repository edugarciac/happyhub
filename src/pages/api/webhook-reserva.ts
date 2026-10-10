import type { NextApiRequest, NextApiResponse } from 'next';
import { notifyAdminReservationRequest } from '@/lib/whatsapp';
import { queryOne } from '@/lib/db';
import { sendEmail, getAdminEmails } from '@/lib/mailer';
import {
  buildReservationCode,
  reservationAdminEmail,
  reservationCustomerEmail,
  EVENT_TYPE_LABELS,
  type ReservationEmailData,
} from '@/lib/emailTemplates';
import { createReservationEvent } from '@/lib/googleCalendar';
import { BOOKINGS_FROM_LABEL, isBeforeBookingStart } from '@/config/opening';
import { isBookableTimeSlot } from '@/utils/pricing';

interface ReservationData {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  date: string;
  time: string;
  timeSlot: string;
  guests: number;
  duration: string;
  extras?: string[];
  paymentMethod: string;
  message?: string;
  needsKidsFurniture?: boolean;
  basePrice: number;
  totalPrice: number;
  depositAmount: number;
  source?: string;
  timestamp?: string;
}

interface ResponseData {
  success: boolean;
  message?: string;
  reservationId?: string;
  error?: string;
  detail?: string;
  emailWarning?: string;
  step?: string;
}

// En Vercel la función se congela al responder: hay que esperar al envío
// (con tope de tiempo) o el WhatsApp puede no salir nunca.
async function notifyAdminSafely(params: Parameters<typeof notifyAdminReservationRequest>[0]) {
  try {
    const sent = await Promise.race([
      notifyAdminReservationRequest(params),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);
    if (!sent) console.error('Admin WhatsApp notification NOT sent for reservation', params.reservationId);
  } catch (err) {
    console.error('Error sending admin WhatsApp notification:', err);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const reservationData: ReservationData = req.body;

    if (!reservationData.name || !reservationData.email || !reservationData.phone) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios',
      });
    }

    if (!reservationData.date || !/^\d{4}-\d{2}-\d{2}$/.test(reservationData.date) || isBeforeBookingStart(reservationData.date)) {
      return res.status(400).json({
        success: false,
        error: `Solo aceptamos reservas a partir del ${BOOKINGS_FROM_LABEL}`,
      });
    }

    if (!isBookableTimeSlot(reservationData.timeSlot)) {
      return res.status(400).json({
        success: false,
        error: 'Franja horaria no disponible. Solo ofrecemos mañana y tarde.',
      });
    }

    const guests = Number.parseInt(String(reservationData.guests), 10) || 0;
    const totalPrice = Number(reservationData.totalPrice) || 0;
    const depositAmount = Number(reservationData.depositAmount) || 0;
    const needsKidsFurniture = reservationData.needsKidsFurniture === true;

    const holidayRow = await queryOne('SELECT 1 FROM holidays WHERE holiday_date = $1', [reservationData.date]).catch(
      () => null
    );
    const isHolidayDate = !!holidayRow;

    // Comprobar disponibilidad y guardar en una sola sentencia: si ya hay una
    // reserva activa en esa fecha y franja, no inserta nada (evita dobles reservas).
    let inserted: { id: number } | null;
    try {
      const user = await queryOne<{ id: number }>('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [
        reservationData.email,
      ]);
      inserted = await queryOne<{ id: number }>(
        `INSERT INTO reservations
           (user_id, event_type, event_date, time_slot, guests, total_price, deposit_amount, notes, status, needs_kids_furniture, created_at)
         SELECT $1::int, $2::text, $3::date, $4::text, $5::int, $6::numeric, $7::numeric, $8::text, 'pending', $9::boolean, NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM reservations
           WHERE event_date = $3::date AND time_slot = $4::text AND status IN ('pending', 'approved', 'confirmed')
         )
         AND NOT EXISTS (
           SELECT 1 FROM blocked_slots WHERE slot_date = $3::date AND time_slot = $4::text
         )
         RETURNING id`,
        [
          user?.id ?? null,
          reservationData.eventType || 'otros',
          reservationData.date,
          reservationData.timeSlot,
          guests,
          totalPrice,
          depositAmount,
          reservationData.message || '',
          needsKidsFurniture,
        ]
      );
    } catch (dbError: any) {
      // 23505 = unique_violation (restricción unique_slot en (event_date, time_slot))
      if (dbError?.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'Esta fecha y franja horaria ya está reservada.',
          step: 'availability',
        });
      }
      console.error('Error guardando la reserva en la BD:', dbError?.message || dbError);
      return res.status(500).json({
        success: false,
        error: 'No se ha podido guardar la reserva. Inténtalo de nuevo o contáctanos.',
        step: 'database',
      });
    }

    if (!inserted) {
      return res.status(409).json({
        success: false,
        error: 'Esta fecha y franja horaria ya está reservada.',
        step: 'availability',
      });
    }

    const reservationId = buildReservationCode(reservationData.date, inserted.id);
    const emailData: ReservationEmailData = {
      code: reservationId,
      name: reservationData.name,
      email: reservationData.email,
      phone: reservationData.phone,
      date: reservationData.date,
      timeSlot: reservationData.timeSlot,
      guests,
      eventType: reservationData.eventType,
      paymentMethod: reservationData.paymentMethod,
      totalPrice,
      depositAmount,
      message: reservationData.message,
      needsKidsFurniture,
      isHoliday: isHolidayDate,
      dbId: inserted.id,
    };

    // Efectos secundarios: se esperan (Vercel congela la función al responder),
    // pero ninguno anula la reserva si falla.
    const customerEmail = reservationCustomerEmail(emailData);
    const adminEmail = reservationAdminEmail(emailData);
    const [calendarEventId, customerEmailSent] = await Promise.all([
      createReservationEvent({
        date: reservationData.date,
        timeSlot: reservationData.timeSlot,
        summary: `${isHolidayDate ? '[FESTIVO] ' : ''}[PENDIENTE] ${EVENT_TYPE_LABELS[reservationData.eventType] || reservationData.eventType} - ${reservationData.name}`,
        description: [
          `Reserva: ${reservationId}`,
          `Nombre: ${reservationData.name}`,
          `Teléfono: ${reservationData.phone}`,
          `Email: ${reservationData.email}`,
          `Invitados: ${guests}`,
          `Total: ${totalPrice} € (señal ${depositAmount} €)`,
          `Pago: ${reservationData.paymentMethod}`,
          reservationData.message ? `Mensaje: ${reservationData.message}` : '',
        ].filter(Boolean).join('\n'),
      }),
      sendEmail({ to: reservationData.email, ...customerEmail }),
      sendEmail({ to: getAdminEmails(), replyTo: reservationData.email, ...adminEmail }),
      notifyAdminSafely({
        name: reservationData.name,
        date: reservationData.date,
        timeSlot: reservationData.timeSlot,
        guests,
        totalPrice,
        depositAmount,
        reservationId,
        needsKidsFurniture,
        isHoliday: isHolidayDate,
      }),
    ]);

    if (calendarEventId) {
      await queryOne('UPDATE reservations SET google_calendar_event_id = $1 WHERE id = $2', [calendarEventId, inserted.id]).catch(
        (err) => console.error('Error guardando google_calendar_event_id:', err)
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Reserva creada exitosamente',
      reservationId,
      ...(customerEmailSent
        ? {}
        : { emailWarning: 'No se pudo enviar el email de confirmación. Te contactaremos pronto.' }),
    });
  } catch (error: any) {
    console.error('Error al procesar la reserva:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Error al procesar la reserva.',
      detail: error?.message,
    });
  }
}
