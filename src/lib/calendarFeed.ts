import crypto from 'crypto';
import { query } from '@/lib/db';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { ensureContractAcceptancesTable } from '@/lib/contractAcceptance';
import { parseReservationExtras } from '@/lib/reservationExtras';
import { buildReservationCode, EVENT_TYPE_LABELS } from '@/lib/emailTemplates';
import { TIME_SLOTS, slotEndTime, type TimeSlot } from '@/utils/pricing';
import { REMAINING_PAYMENT_METHOD_LABELS } from '@/utils/reservationStatus';
import { buildIcsCalendar, type IcsEvent } from '@/utils/icalendar';

// Calendario de suscripción (.ics) con las reservas y las fechas bloqueadas, generado desde la BD en cada petición

const LOCATION = 'HappyHub - C/ Rovellat, 27, 08950 Esplugues de Llobregat';

function feedSecret(): string | null {
  return process.env.CALENDAR_FEED_SECRET || process.env.NEXTAUTH_SECRET || null;
}

/** Token secreto del enlace del calendario; null si no hay secreto configurado */
export function calendarFeedToken(): string | null {
  const secret = feedSecret();
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update('happyhub-calendar-feed').digest('hex').slice(0, 32);
}

export function isValidCalendarFeedToken(token: string): boolean {
  const expected = calendarFeedToken();
  if (!expected || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function calendarFeedUrl(baseUrl: string): string | null {
  const token = calendarFeedToken();
  return token ? `${baseUrl.replace(/\/$/, '')}/api/calendar/${token}.ics` : null;
}

function statusPrefix(status: string, paymentStatus: string | null): string {
  if (status === 'pending') return '⏳ [Pendiente]';
  if (status === 'approved') return '💳 [Esperando señal]';
  if (status === 'completed') return '✔️ [Realizada]';
  return paymentStatus === 'fully_paid' ? '✅ [Pagada]' : '✅ [Señal pagada]';
}

function slotTimes(timeSlot: string, extraHours: number): { start: string; end: string } | null {
  const slot = TIME_SLOTS.find((s) => s.id === timeSlot);
  if (!slot) return null;
  return { start: slot.startTime, end: slotEndTime(timeSlot as TimeSlot, extraHours) || slot.endTime };
}

export async function buildCalendarFeed(baseUrl: string): Promise<string> {
  await ensureReservationFlowColumns();
  await ensureContractAcceptancesTable();

  const reservations = await query<{
    id: number;
    event_date: string;
    time_slot: string;
    extra_hours: number | null;
    extras: unknown;
    event_type: string | null;
    guests: number | null;
    total_price: string | null;
    deposit_amount: string | null;
    payment_status: string | null;
    payment_method: string | null;
    remaining_payment_method: string | null;
    status: string;
    notes: string | null;
    needs_kids_furniture: boolean | null;
    updated_at: Date | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  }>(
    `SELECT r.id, TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot, r.extra_hours, r.extras,
            r.event_type, r.guests, r.total_price, r.deposit_amount, r.payment_status, r.payment_method,
            r.remaining_payment_method, r.status, r.notes, r.needs_kids_furniture, r.updated_at,
            COALESCE(u.name, ca.customer_name) AS name,
            COALESCE(u.email, ca.customer_email) AS email,
            COALESCE(u.phone, ca.customer_phone) AS phone
     FROM reservations r
     LEFT JOIN users u ON r.user_id = u.id
     LEFT JOIN LATERAL (
       SELECT customer_name, customer_email, customer_phone FROM contract_acceptances
       WHERE reservation_id = r.id ORDER BY id DESC LIMIT 1
     ) ca ON true
     WHERE r.status IN ('pending', 'approved', 'confirmed', 'completed')
       AND r.event_date >= CURRENT_DATE - INTERVAL '90 days'
     ORDER BY r.event_date, r.id`
  );

  const blocked = await query<{ id: number; slot_date: string; time_slot: string; reason: string | null }>(
    `SELECT id, TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, time_slot, reason
     FROM blocked_slots WHERE slot_date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY slot_date`
  ).catch(() => ({ rows: [] as { id: number; slot_date: string; time_slot: string; reason: string | null }[] }));

  const events: IcsEvent[] = [];
  for (const r of reservations.rows) {
    const extraHours = Number(r.extra_hours) || 0;
    const times = slotTimes(r.time_slot, extraHours);
    if (!times) continue;
    const code = buildReservationCode(r.event_date, r.id);
    const eventType = EVENT_TYPE_LABELS[r.event_type || ''] || r.event_type || '';
    const extras = parseReservationExtras(r.extras);
    const total = Number(r.total_price) || 0;
    const deposit = Number(r.deposit_amount) || 0;
    const payment =
      r.payment_status === 'fully_paid'
        ? `Pagado completo${r.remaining_payment_method ? ` (resto: ${REMAINING_PAYMENT_METHOD_LABELS[r.remaining_payment_method] || r.remaining_payment_method})` : ''}`
        : r.payment_status === 'deposit_paid'
          ? `Señal pagada · falta ${Math.round((total - deposit) * 100) / 100} €`
          : `Sin pagar (${r.payment_method === 'bizum' ? 'Bizum' : 'tarjeta'})`;

    events.push({
      uid: `reservation-${r.id}@happyhub.es`,
      date: r.event_date,
      start: times.start,
      end: times.end,
      summary: `${statusPrefix(r.status, r.payment_status)} ${r.name || 'Cliente'} · ${Number(r.guests) || 0} pers.${eventType ? ` · ${eventType}` : ''}`,
      description: [
        `Reserva ${code}`,
        r.phone ? `Teléfono: ${r.phone}` : '',
        r.email ? `Email: ${r.email}` : '',
        `Personas: ${Number(r.guests) || 0}`,
        extraHours > 0 ? `Horas extra: ${extraHours} (hasta las ${times.end})` : '',
        extras.length ? `Servicios: ${extras.map((e) => e.title).join(', ')}` : '',
        r.needs_kids_furniture ? 'Mesas/sillas de niños' : '',
        `Total: ${total} € (señal ${deposit} €)`,
        `Pago: ${payment}`,
        r.notes ? `Notas: ${r.notes}` : '',
        `${baseUrl.replace(/\/$/, '')}/admin/reservations`,
      ].filter(Boolean).join('\n'),
      location: LOCATION,
      status: r.status === 'pending' || r.status === 'approved' ? 'TENTATIVE' : 'CONFIRMED',
      lastModified: r.updated_at ? new Date(r.updated_at) : undefined,
    });
  }

  for (const b of blocked.rows) {
    const times = slotTimes(b.time_slot, 0);
    if (!times) continue;
    events.push({
      uid: `blocked-${b.id}@happyhub.es`,
      date: b.slot_date,
      start: times.start,
      end: times.end,
      summary: `🔒 Bloqueado${b.reason ? `: ${b.reason}` : ''}`,
      status: 'CONFIRMED',
    });
  }

  return buildIcsCalendar('HappyHub · Reservas', events);
}
