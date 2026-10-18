import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudit } from '@/lib/audit';
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
import { computeReservationPrice } from '@/lib/reservationPricing';
import { ensureReservationFlowColumns, expireUnpaidReservations } from '@/lib/reservationFlow';
import { isBookingPaymentMethod } from '@/config/payments';
import { BOOKINGS_FROM_LABEL, isBeforeBookingStart } from '@/config/opening';
import { isOpeningDiscountEligible, OPENING_DISCOUNT } from '@/config/promotions';
import { isBookableTimeSlot, isValidExtraHours, extraHoursPrice, slotEndTime } from '@/utils/pricing';
import {
  ensureContractAcceptancesTable,
  recordContractAcceptance,
  markConfirmationEmailSent,
  TERMS_TEXT_MIN,
  TERMS_TEXT_MAX,
} from '@/lib/contractAcceptance';

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
  extraHours?: number;
  extras?: string[];
  paymentMethod: string;
  message?: string;
  needsKidsFurniture?: boolean;
  basePrice: number;
  discountAmount?: number;
  totalPrice: number;
  depositAmount: number;
  source?: string;
  timestamp?: string;
  // Aceptación de los términos (prueba guardada en contract_acceptances)
  acceptTerms?: boolean;
  termsVersion?: string;
  termsText?: string;
  termsScrolledToEnd?: boolean;
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

async function handler(
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

    if ((Number(reservationData.discountAmount) || 0) > 0 && !isOpeningDiscountEligible(reservationData.date)) {
      return res.status(400).json({
        success: false,
        error: `El ${OPENING_DISCOUNT.label.toLowerCase()} ya no está disponible para esta reserva. Recarga la página para ver el precio actualizado.`,
        step: 'discount',
      });
    }

    if (!isBookableTimeSlot(reservationData.timeSlot)) {
      return res.status(400).json({
        success: false,
        error: 'Franja horaria no disponible. Solo ofrecemos mañana y tarde.',
      });
    }

    const extraHours = reservationData.extraHours ?? 0;
    if (!isValidExtraHours(reservationData.timeSlot, extraHours)) {
      return res.status(400).json({
        success: false,
        error: 'Las horas adicionales solo se pueden añadir a la franja de tarde (máximo hasta las 23:00h).',
        step: 'extra_hours',
      });
    }

    const termsText = typeof reservationData.termsText === 'string' ? reservationData.termsText.trim() : '';
    const termsVersion = typeof reservationData.termsVersion === 'string' ? reservationData.termsVersion.trim().slice(0, 100) : '';
    if (
      reservationData.acceptTerms !== true ||
      !termsVersion ||
      termsText.length < TERMS_TEXT_MIN ||
      termsText.length > TERMS_TEXT_MAX
    ) {
      return res.status(400).json({
        success: false,
        error: 'Debes leer y aceptar los términos y condiciones. Si ya lo hiciste, recarga la página e inténtalo de nuevo.',
        step: 'terms',
      });
    }

    if (!isBookingPaymentMethod(reservationData.paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Método de pago no válido. Elige tarjeta o Bizum.',
      });
    }

    const guests = Number.parseInt(String(reservationData.guests), 10) || 0;
    const extras = Array.isArray(reservationData.extras) ? reservationData.extras.map(String) : [];

    // El precio se recalcula aquí: el total del navegador solo se usa para detectar que ha cambiado
    let price;
    try {
      price = await computeReservationPrice({
        date: reservationData.date,
        timeSlot: reservationData.timeSlot,
        extraHours,
        extraIds: extras,
      });
    } catch (priceError: any) {
      console.error('Error calculando el precio de la reserva:', priceError?.message || priceError);
      return res.status(500).json({
        success: false,
        error: 'No se ha podido calcular el precio. Inténtalo de nuevo o contáctanos.',
        step: 'price',
      });
    }
    if (!price.ok) {
      return res.status(400).json({
        success: false,
        error:
          price.reason === 'consult'
            ? 'Esta fecha tiene precio a consultar. Por favor, contacta con nosotros para reservarla.'
            : 'Alguno de los servicios seleccionados ya no está disponible. Recarga la página e inténtalo de nuevo.',
        step: 'price',
      });
    }
    if (Math.abs(price.total - (Number(reservationData.totalPrice) || 0)) > 0.01) {
      return res.status(409).json({
        success: false,
        error: `El precio de tu reserva ha cambiado (ahora es ${price.total} €). Recarga la página para ver el precio actualizado.`,
        step: 'price',
      });
    }
    const totalPrice = price.total;
    const depositAmount = price.deposit;
    const discountAmount = price.discount;
    const needsKidsFurniture = reservationData.needsKidsFurniture === true;

    const holidayRow = await queryOne('SELECT 1 FROM holidays WHERE holiday_date = $1', [reservationData.date]).catch(
      () => null
    );
    const isHolidayDate = !!holidayRow;

    // Comprobar disponibilidad y guardar en una sola sentencia: si ya hay una
    // reserva activa en esa fecha y franja, no inserta nada (evita dobles reservas).
    // Liberar antes las franjas con la señal sin pagar fuera de plazo
    await expireUnpaidReservations();

    let inserted: { id: number } | null;
    try {
      await ensureReservationFlowColumns();
      // Si no se puede preparar el registro de la prueba, no se crea la reserva
      await ensureContractAcceptancesTable();
      const user = await queryOne<{ id: number }>('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [
        reservationData.email,
      ]);
      inserted = await queryOne<{ id: number }>(
        `INSERT INTO reservations
           (user_id, event_type, event_date, time_slot, guests, total_price, deposit_amount, notes, status, needs_kids_furniture, payment_method, extra_hours, created_at)
         SELECT $1::int, $2::text, $3::date, $4::text, $5::int, $6::numeric, $7::numeric, $8::text, 'pending', $9::boolean, $10::text, $11::int, NOW()
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
          reservationData.paymentMethod,
          extraHours,
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

    // Prueba de aceptación de los términos: sin prueba guardada no hay reserva.
    let acceptance;
    try {
      acceptance = await recordContractAcceptance(req, {
        reservationId: inserted.id,
        reservationCode: reservationId,
        customerName: reservationData.name,
        customerEmail: reservationData.email,
        customerPhone: reservationData.phone,
        termsVersion,
        termsText,
        scrolledToEnd: reservationData.termsScrolledToEnd === true,
        contractSnapshot: {
          eventDate: reservationData.date,
          timeSlot: reservationData.timeSlot,
          eventType: reservationData.eventType || 'otros',
          guests,
          extraHours,
          extraHoursPrice: extraHoursPrice(extraHours),
          extras,
          extrasTotal: price.extrasTotal,
          basePrice: price.basePrice,
          discountAmount,
          totalPrice,
          depositAmount,
          paymentMethod: reservationData.paymentMethod,
          needsKidsFurniture,
          isHoliday: isHolidayDate,
          message: reservationData.message || '',
        },
      });
    } catch (acceptanceError: any) {
      console.error('Error guardando la prueba de aceptación; se anula la reserva', inserted.id, acceptanceError?.message || acceptanceError);
      await queryOne('DELETE FROM reservations WHERE id = $1', [inserted.id]).catch((err) =>
        console.error('No se pudo anular la reserva sin prueba de aceptación', inserted!.id, err)
      );
      return res.status(500).json({
        success: false,
        error: 'No se ha podido registrar la aceptación de los términos. Inténtalo de nuevo o contáctanos.',
        step: 'terms',
      });
    }
    const emailData: ReservationEmailData = {
      code: reservationId,
      name: reservationData.name,
      email: reservationData.email,
      phone: reservationData.phone,
      date: reservationData.date,
      timeSlot: reservationData.timeSlot,
      guests,
      extraHours,
      eventType: reservationData.eventType,
      paymentMethod: reservationData.paymentMethod,
      totalPrice,
      depositAmount,
      discountAmount,
      message: reservationData.message,
      needsKidsFurniture,
      isHoliday: isHolidayDate,
      dbId: inserted.id,
      termsVersion: acceptance.terms_version,
      termsAcceptedAt: acceptance.accepted_at,
    };

    // Efectos secundarios: se esperan (Vercel congela la función al responder),
    // pero ninguno anula la reserva si falla.
    const customerEmail = reservationCustomerEmail(emailData);
    const adminEmail = reservationAdminEmail(emailData);
    const [calendarEventId, customerEmailSent] = await Promise.all([
      createReservationEvent({
        date: reservationData.date,
        timeSlot: reservationData.timeSlot,
        extraHours,
        summary: `${isHolidayDate ? '[FESTIVO] ' : ''}[PENDIENTE] ${EVENT_TYPE_LABELS[reservationData.eventType] || reservationData.eventType} - ${reservationData.name}`,
        description: [
          `Reserva: ${reservationId}`,
          `Nombre: ${reservationData.name}`,
          `Teléfono: ${reservationData.phone}`,
          `Email: ${reservationData.email}`,
          `Invitados: ${guests}`,
          extraHours > 0 ? `Horas adicionales: ${extraHours} (${extraHoursPrice(extraHours)} €), hasta las ${slotEndTime('afternoon', extraHours)}h` : '',
          `Total: ${totalPrice} € (señal ${depositAmount} €)${discountAmount > 0 ? ` · ${OPENING_DISCOUNT.label} -${discountAmount} €` : ''}`,
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

    if (customerEmailSent) {
      await markConfirmationEmailSent(acceptance.id).catch((err) =>
        console.error('Error registrando el envío del email de confirmación:', err)
      );
    }

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

export default withAudit('reservation.web', handler, { methods: ['POST'] });
