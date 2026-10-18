import {
  escapeHtml,
  buildReservationCode,
  formatDateEs,
  reservationCustomerEmail,
  reservationAdminEmail,
  reservationCancelledEmail,
} from '@/lib/emailTemplates';

const base = {
  code: 'RES-20261016-007',
  name: 'Ana <script>',
  email: 'ana@example.com',
  phone: '600000000',
  date: '2026-10-16',
  timeSlot: 'afternoon',
  guests: 20,
  eventType: 'celebracion-familiar',
  paymentMethod: 'cash',
  totalPrice: 200,
  depositAmount: 60,
  message: '"hola" & <b>',
};

describe('emailTemplates', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
    expect(escapeHtml(null)).toBe('');
  });

  it('builds the reservation code like n8n did', () => {
    expect(buildReservationCode('2026-10-16', 7)).toBe('RES-20261016-007');
    expect(buildReservationCode('2026-10-16', 1234)).toBe('RES-20261016-1234');
  });

  it('formats dates as DD/MM/YYYY', () => {
    expect(formatDateEs('2026-10-16')).toBe('16/10/2026');
  });

  it('customer email includes key data and escapes user input', () => {
    const { subject, html } = reservationCustomerEmail(base);
    expect(subject).toContain('RES-20261016-007');
    expect(html).toContain('16/10/2026');
    expect(html).toContain('Tarde (16:00 - 20:00h)');
    expect(html).toContain('Celebración familiar');
    expect(html).toContain('Ana &lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('admin email flags holidays and escapes the message', () => {
    const { subject, html } = reservationAdminEmail({ ...base, isHoliday: true, needsKidsFurniture: true });
    expect(subject.startsWith('[FESTIVO]')).toBe(true);
    expect(html).toContain('&quot;hola&quot; &amp; &lt;b&gt;');
    expect(html).toContain('mesas/sillas de niños');
  });

  it('cancellation email shows reason for rejections', () => {
    const { subject, html } = reservationCancelledEmail({
      name: 'Ana',
      status: 'rejected',
      date: '2026-10-16',
      timeSlot: 'morning',
      reason: 'Fecha no disponible',
    });
    expect(subject).toContain('solicitud');
    expect(html).toContain('Fecha no disponible');
    expect(html).toContain('Mañana (10:00 - 14:00h)');
  });
});

import { reservationApprovedEmail, depositReceivedEmail, depositReminderEmail, remainingPaymentReminderEmail, dayOfPaymentEmail } from '@/lib/emailTemplates';
import { isBookingPaymentMethod } from '@/config/payments';

describe('approval & payment flow emails', () => {
  const approved = {
    name: 'Ana',
    code: 'RES-20261020-007',
    date: '2026-10-20',
    timeSlot: 'afternoon',
    depositAmount: 60,
    totalPrice: 200,
    payUrl: 'https://www.happyhub.es/pagar/abc',
    dueAt: new Date('2026-10-11T16:30:00Z'),
  };

  it('request email explains pending approval for card and bizum', () => {
    const card = reservationCustomerEmail({ ...base, paymentMethod: 'card' }).html;
    expect(card).toContain('pendiente de aprobación');
    expect(card).toContain('pagar la señal de <strong>60 €</strong> con tarjeta');
    expect(card).toContain('24 horas');
    const bizum = reservationCustomerEmail({ ...base, paymentMethod: 'bizum' }).html;
    expect(bizum).toContain('por Bizum');
  });

  it('approval email for card has the pay button and Madrid deadline', () => {
    const { subject, html } = reservationApprovedEmail({ ...approved, paymentMethod: 'card' });
    expect(subject).toContain('RES-20261020-007');
    expect(html).toContain('https://www.happyhub.es/pagar/abc');
    expect(html).toContain('Pagar la señal (60 €)');
    expect(html).toContain('11/10/2026, 18:30'); // 16:30 UTC = 18:30 Madrid (CEST)
  });

  it('approval email for bizum has phone, amount, concept and card fallback', () => {
    const { html } = reservationApprovedEmail({ ...approved, paymentMethod: 'bizum' });
    expect(html).toContain('624 645 517');
    expect(html).toContain('RES-20261020-007');
    expect(html).toContain('Pagar con tarjeta');
  });

  it('approval email warns about the reminder before cancelling', () => {
    const { html } = reservationApprovedEmail({ ...approved, paymentMethod: 'card' });
    expect(html).toContain('te enviaremos un recordatorio');
    expect(html).not.toContain('se cancelará automáticamente');
  });

  it('reminder email has the pay link, the new deadline and the 24 h cancellation warning', () => {
    const { subject, html } = depositReminderEmail({ ...approved, paymentMethod: 'card' });
    expect(subject).toContain('Recordatorio');
    expect(subject).toContain('RES-20261020-007');
    expect(html).toContain('https://www.happyhub.es/pagar/abc');
    expect(html).toContain('Pagar la señal (60 €)');
    expect(html).toContain('próximas 24 horas (hasta el 11/10/2026, 18:30)');
    expect(html).toContain('la reserva se cancelará');
  });

  it('reminder email for bizum keeps the Bizum instructions', () => {
    const { html } = depositReminderEmail({ ...approved, paymentMethod: 'bizum' });
    expect(html).toContain('624 645 517');
    expect(html).toContain('Pagar con tarjeta');
  });

  it('remaining payment reminder asks to pay the remaining before the event', () => {
    const { subject, html } = remainingPaymentReminderEmail({
      name: 'Ana', code: 'RES-20261020-007', date: '2026-10-20', timeSlot: 'afternoon', totalPrice: 200, depositPaid: 60,
      payUrl: 'https://www.happyhub.es/pagar/xyz',
    });
    expect(subject).toBe('Tu evento es en 3 días: paga el resto de la reserva RES-20261020-007 (140 €)');
    expect(html).toContain('antes del evento');
    expect(html).toContain('<strong>140 €</strong>');
    expect(html).toContain('href="https://www.happyhub.es/pagar/xyz"');
    expect(html).toContain('Pagar 140 €');
    expect(html).toContain('fianza de 150 €');
  });

  it('day-of email asks to pay the remaining and hold the deposit', () => {
    const base = { name: 'Ana', code: 'RES-20261020-007', date: '2026-10-20', timeSlot: 'afternoon', payUrl: 'https://www.happyhub.es/pagar/d1', expiresAt: new Date('2026-10-23T10:00:00Z') };
    const pending = dayOfPaymentEmail({ ...base, remaining: 140 });
    expect(pending.subject).toBe('Reserva RES-20261020-007: paga el resto (140 €) y bloquea la fianza');
    expect(pending.html).toContain('Pagar el resto: 140 €');
    expect(pending.html).toContain('Bloquear la fianza de 150 €');
    expect(pending.html).toContain('href="https://www.happyhub.es/pagar/d1"');
    expect(pending.html).toContain('no es un cobro');

    const onlyDeposit = dayOfPaymentEmail({ ...base, remaining: 0 });
    expect(onlyDeposit.subject).toBe('Reserva RES-20261020-007: bloquea la fianza de 150 €');
    expect(onlyDeposit.html).toContain('El resto ya está pagado');
    expect(onlyDeposit.html).not.toContain('Resto pendiente');
  });

  it('deposit received email shows remaining amount', () => {
    const { html } = depositReceivedEmail({ name: 'Ana', code: 'RES-20261020-007', date: '2026-10-20', timeSlot: 'afternoon', depositAmount: 60, totalPrice: 200 });
    expect(html).toContain('140 €');
  });

  it('only card and bizum are valid payment methods', () => {
    expect(isBookingPaymentMethod('card')).toBe(true);
    expect(isBookingPaymentMethod('bizum')).toBe(true);
    expect(isBookingPaymentMethod('cash')).toBe(false);
    expect(isBookingPaymentMethod(undefined)).toBe(false);
  });
});

describe('emailTemplates extra hours', () => {
  it('shows the extended schedule and the extra hours cost', () => {
    const { html } = reservationCustomerEmail({ ...base, extraHours: 2 });
    expect(html).toContain('Tarde (16:00 - 22:00h)');
    expect(html).toContain('2 × 60 € = 120 €');
    expect(reservationAdminEmail({ ...base, extraHours: 2 }).html).toContain('Horas adicionales');
  });

  it('omits extra hours when there are none', () => {
    expect(reservationCustomerEmail(base).html).not.toContain('Horas adicionales');
  });
});
