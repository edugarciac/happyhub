// Plantillas HTML de los correos transaccionales (adaptadas de los workflows de n8n)
import { BIZUM_PHONE, PAYMENT_GRACE_HOURS, PAYMENT_WINDOW_HOURS, SECURITY_DEPOSIT_AMOUNT, formatDueAt } from '@/config/payments';
import { EXTRA_HOUR_PRICE, extraHoursPrice, slotEndTime } from '@/utils/pricing';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  'cumpleaños': 'Cumpleaños',
  'celebracion-familiar': 'Celebración familiar',
  'eventos-amigos': 'Eventos con amigos',
  'eventos-colegio-trabajo': 'Eventos de colegio/trabajo',
  taller: 'Taller',
  otros: 'Otros',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Tarjeta',
  bizum: 'Bizum',
  cash: 'Efectivo',
};

export const SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (10:00 - 14:00h)',
  afternoon: 'Tarde (16:00 - 20:00h)',
  night: 'Noche (22:00 - 02:00h)',
};

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' */
export function formatDateEs(date: string): string {
  const [y, m, d] = date.split('-');
  return y && m && d ? `${d}/${m}/${y}` : date;
}

export { buildReservationCode } from '@/utils/reservationCode';

const CONTACT_HTML = `<p style="font-size: 14px; color: #666;">Si tienes alguna pregunta, no dudes en contactarnos:</p>
    <p style="font-size: 14px;">Tel: <a href="tel:+34624645517" style="color: #FF6B35;">624 645 517</a><br>Email: <a href="mailto:hola@happyhub.es" style="color: #FF6B35;">hola@happyhub.es</a></p>`;

function layout(title: string, subtitle: string, body: string, footer = 'Happyhub - C/ Rovellat, 27, 08950 Esplugues de Llobregat'): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 26px;">${title}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">${subtitle}</p>
  </div>
  <div style="padding: 30px; background: #fff; border: 1px solid #eee;">
    ${body}
  </div>
  <div style="padding: 20px; text-align: center; background: #f9f9f9; border-radius: 0 0 12px 12px; border: 1px solid #eee; border-top: 0;">
    <p style="margin: 0; font-size: 12px; color: #999;">${footer}</p>
  </div>
</div>`;
}

function rows(items: [string, string][]): string {
  return `<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
${items
  .map(
    ([k, v]) =>
      `      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px 0; color: #888;">${k}</td><td style="padding: 10px 0;">${v}</td></tr>`
  )
  .join('\n')}
    </table>`;
}

function note(html: string): string {
  return `<div style="background: #FFF3E0; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px;">${html}</p>
    </div>`;
}

export interface ReservationEmailData {
  code: string;
  name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  guests: number;
  /** Horas adicionales tras las 20:00 (solo tarde) */
  extraHours?: number;
  eventType: string;
  paymentMethod: string;
  totalPrice: number;
  depositAmount: number;
  discountAmount?: number;
  message?: string;
  needsKidsFurniture?: boolean;
  isHoliday?: boolean;
  dbId?: number;
  /** Prueba de aceptación de los términos (art. 28 LSSI: confirmar la aceptación por email) */
  termsVersion?: string;
  termsAcceptedAt?: string | Date;
}

/** Horario de la reserva, con la hora de fin ampliada si hay horas adicionales */
export function reservationScheduleLabel(timeSlot: string, extraHours = 0): string {
  if (extraHours > 0 && timeSlot === 'afternoon') return `Tarde (16:00 - ${slotEndTime('afternoon', extraHours)}h)`;
  return SLOT_LABELS[timeSlot] || timeSlot;
}

function extraHoursRows(extraHours = 0): [string, string][] {
  if (extraHours <= 0) return [];
  return [[
    'Horas adicionales',
    `${escapeHtml(extraHours)} × ${EXTRA_HOUR_PRICE} € = ${escapeHtml(extraHoursPrice(extraHours))} €`,
  ]];
}

function formatAcceptedAt(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'long', timeStyle: 'medium' });
}

export function reservationCustomerEmail(r: ReservationEmailData): { subject: string; html: string } {
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">¡Hola ${escapeHtml(r.name)}!</h2>
    <p>Hemos recibido tu solicitud de reserva. Este es el resumen:</p>
    ${rows([
      ['Nº de reserva', `<strong>${escapeHtml(r.code)}</strong>`],
      ['Fecha', escapeHtml(formatDateEs(r.date))],
      ['Horario', escapeHtml(reservationScheduleLabel(r.timeSlot, r.extraHours))],
      ['Invitados', `${escapeHtml(r.guests)} personas`],
      ['Tipo de evento', escapeHtml(EVENT_TYPE_LABELS[r.eventType] || r.eventType)],
      ['Método de pago', escapeHtml(PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod)],
      ...extraHoursRows(r.extraHours),
      ...(r.discountAmount
        ? ([['Descuento inauguración (-10%)', `<span style="color: #15803d;">-${escapeHtml(r.discountAmount)} €</span>`]] as [string, string][])
        : []),
      ['Precio total', `<strong style="font-size: 18px;">${escapeHtml(r.totalPrice)} €</strong>`],
      ['Señal (30%)', `<strong style="color: #FF6B35;">${escapeHtml(r.depositAmount)} €</strong>`],
    ])}
    ${note(
      `<strong>Tu solicitud está pendiente de aprobación.</strong> ${
        r.isHoliday ? 'Al ser festivo, la revisaremos caso a caso. ' : ''
      }Cuando la aprobemos te enviaremos un correo ${
        r.paymentMethod === 'bizum'
          ? `con las instrucciones para pagar la señal de <strong>${escapeHtml(r.depositAmount)} €</strong> por Bizum`
          : `con el enlace para pagar la señal de <strong>${escapeHtml(r.depositAmount)} €</strong> con tarjeta`
      }. Tendrás ${PAYMENT_WINDOW_HOURS} horas para pagarla; si no, te enviaremos un recordatorio y la reserva se cancelará si no se paga en las ${PAYMENT_GRACE_HOURS} horas siguientes.`
    )}
    ${
      r.termsVersion && r.termsAcceptedAt
        ? `<p style="font-size: 13px; color: #555;">Has aceptado los <a href="https://www.happyhub.es/terminos">términos y condiciones</a> (versión del ${escapeHtml(
            r.termsVersion
          )}) el ${escapeHtml(formatAcceptedAt(r.termsAcceptedAt))} (hora peninsular). Guardamos el texto aceptado como prueba del contrato; puedes pedirnos una copia en hola@happyhub.es.</p>`
        : ''
    }
    ${CONTACT_HTML}`;
  return {
    subject: `Solicitud de reserva ${r.code} - HappyHub`,
    html: layout('HappyHub', 'Tu espacio para celebrar', body),
  };
}

export function reservationAdminEmail(r: ReservationEmailData): { subject: string; html: string } {
  const extra = [
    r.isHoliday ? '🎉 <strong>FESTIVO</strong>: requiere confirmación caso a caso, no se ha cobrado señal.' : '',
    r.needsKidsFurniture ? '🪑 Necesita mesas/sillas de niños.' : '',
  ].filter(Boolean).join('<br>');
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">Detalles del evento</h2>
    ${rows([
      ['Fecha', escapeHtml(formatDateEs(r.date))],
      ['Horario', escapeHtml(reservationScheduleLabel(r.timeSlot, r.extraHours))],
      ['Tipo', escapeHtml(EVENT_TYPE_LABELS[r.eventType] || r.eventType)],
      ['Invitados', `${escapeHtml(r.guests)} personas`],
      ...extraHoursRows(r.extraHours),
      ...(r.discountAmount
        ? ([['Descuento inauguración', `-${escapeHtml(r.discountAmount)} €`]] as [string, string][])
        : []),
      ['Total', `<strong style="color: #FF6B35; font-size: 18px;">${escapeHtml(r.totalPrice)} €</strong>`],
      ['Señal', `${escapeHtml(r.depositAmount)} €`],
    ])}
    <h2 style="color: #FF6B35;">Datos del cliente</h2>
    ${rows([
      ['Nombre', escapeHtml(r.name)],
      ['Email', `<a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>`],
      ['Teléfono', `<a href="tel:${escapeHtml(r.phone)}">${escapeHtml(r.phone)}</a>`],
      ['Pago', escapeHtml(PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod)],
      ['Mensaje', escapeHtml(r.message || '—')],
    ])}
    ${extra ? note(extra) : ''}
    <p style="font-size: 14px;">Revísala en el <a href="https://www.happyhub.es/admin/reservations" style="color: #FF6B35;">panel de administración</a>.</p>`;
  return {
    subject: `${r.isHoliday ? '[FESTIVO] ' : ''}Nueva reserva ${r.code} - Requiere revisión`,
    html: layout('Nueva reserva recibida', escapeHtml(r.code), body, 'HappyHub - Sistema de reservas'),
  };
}

export function passwordResetEmail(name: string, resetUrl: string): { subject: string; html: string } {
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">Hola ${escapeHtml(name || '')}</h2>
    <p>Hemos recibido una solicitud para restablecer tu contraseña. Pulsa el botón para elegir una nueva:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(resetUrl)}" style="background: #FF6B35; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Restablecer contraseña</a>
    </p>
    <p style="font-size: 13px; color: #888;">El enlace caduca en 24 horas. Si no has sido tú, ignora este correo.</p>`;
  return { subject: 'Restablece tu contraseña - HappyHub', html: layout('HappyHub', 'Restablecer contraseña', body) };
}

export function reservationCancelledEmail(params: {
  name: string;
  status: 'cancelled' | 'rejected';
  date: string;
  timeSlot: string;
  reason?: string | null;
}): { subject: string; html: string } {
  const isRejected = params.status === 'rejected';
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">Hola ${escapeHtml(params.name || '')}</h2>
    <p>${
      isRejected
        ? 'Lo sentimos, no hemos podido aceptar tu solicitud de reserva:'
        : 'Te confirmamos que tu reserva ha sido cancelada:'
    }</p>
    ${rows([
      ['Fecha', escapeHtml(formatDateEs(params.date))],
      ['Horario', escapeHtml(SLOT_LABELS[params.timeSlot] || params.timeSlot)],
      ...(params.reason ? ([['Motivo', escapeHtml(params.reason)]] as [string, string][]) : []),
    ])}
    <p>Si quieres elegir otra fecha, puedes hacerlo en <a href="https://www.happyhub.es/disponibilidad" style="color: #FF6B35;">happyhub.es</a>.</p>
    ${CONTACT_HTML}`;
  return {
    subject: isRejected ? 'Tu solicitud de reserva - HappyHub' : 'Reserva cancelada - HappyHub',
    html: layout('HappyHub', isRejected ? 'Solicitud de reserva' : 'Reserva cancelada', body),
  };
}

type DepositEmailParams = {
  name: string;
  code: string;
  date: string;
  timeSlot: string;
  depositAmount: number;
  totalPrice: number;
  paymentMethod: string;
  payUrl: string;
  dueAt: Date;
};

/** Datos de la reserva + instrucciones de pago de la señal (tarjeta o Bizum) */
function depositPaymentBlock(params: DepositEmailParams): string {
  const amount = escapeHtml(params.depositAmount);
  const button = (label: string) => `<p style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(params.payUrl)}" style="background: #FF6B35; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">${label}</a>
    </p>`;
  const payment =
    params.paymentMethod === 'bizum'
      ? `<h3 style="color: #FF6B35; margin-bottom: 8px;">Paga la señal por Bizum</h3>
    ${rows([
      ['Importe', `<strong>${amount} €</strong>`],
      ['Enviar a', `<strong>${escapeHtml(BIZUM_PHONE)}</strong>`],
      ['Concepto', `<strong>${escapeHtml(params.code)}</strong>`],
    ])}
    <p style="font-size: 13px; color: #666;">¿Prefieres pagar con tarjeta? También puedes hacerlo aquí:</p>
    ${button('Pagar con tarjeta')}`
      : `<p>Para confirmar tu reserva, paga la señal de <strong>${amount} €</strong> con tarjeta:</p>
    ${button(`Pagar la señal (${amount} €)`)}`;
  return `${rows([
      ['Nº de reserva', `<strong>${escapeHtml(params.code)}</strong>`],
      ['Fecha', escapeHtml(formatDateEs(params.date))],
      ['Horario', escapeHtml(SLOT_LABELS[params.timeSlot] || params.timeSlot)],
      ['Precio total', `${escapeHtml(params.totalPrice)} €`],
    ])}
    ${payment}`;
}

/** Recordatorio a las 24 h sin pagar la señal: último aviso antes de cancelar */
export function depositReminderEmail(params: DepositEmailParams): { subject: string; html: string } {
  const due = escapeHtml(formatDueAt(params.dueAt));
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">¡Hola ${escapeHtml(params.name || '')}! Aún no hemos recibido la señal</h2>
    <p>Tu reserva sigue aprobada, pero todavía no nos ha llegado el pago de la señal.</p>
    ${depositPaymentBlock(params)}
    ${note(`<strong>Si no se abona la señal en las próximas ${PAYMENT_GRACE_HOURS} horas (hasta el ${due}), la reserva se cancelará</strong> y la fecha quedará libre. Si ya la has pagado, ignora este correo.`)}
    ${CONTACT_HTML}`;
  return {
    subject: `Recordatorio: paga la señal de la reserva ${params.code} antes del ${formatDueAt(params.dueAt)}`,
    html: layout('HappyHub', 'Recordatorio de pago', body),
  };
}

export function reservationApprovedEmail(params: DepositEmailParams): { subject: string; html: string } {
  const due = escapeHtml(formatDueAt(params.dueAt));
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">¡Hola ${escapeHtml(params.name || '')}! Tu reserva está aprobada 🎉</h2>
    ${depositPaymentBlock(params)}
    ${note(`<strong>Tienes hasta el ${due}</strong> (${PAYMENT_WINDOW_HOURS} horas) para pagar la señal. Si no la recibimos a tiempo, te enviaremos un recordatorio y, si no se paga en las ${PAYMENT_GRACE_HOURS} horas siguientes, la reserva se cancelará y la fecha quedará libre.`)}
    ${CONTACT_HTML}`;

  return {
    subject: `Reserva ${params.code} aprobada: paga la señal antes del ${formatDueAt(params.dueAt)}`,
    html: layout('HappyHub', 'Reserva aprobada', body),
  };
}

export function depositReceivedEmail(params: {
  name: string;
  code: string;
  date: string;
  timeSlot: string;
  depositAmount: number;
  totalPrice: number;
}): { subject: string; html: string } {
  const remaining = Math.max(0, (Number(params.totalPrice) || 0) - (Number(params.depositAmount) || 0));
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">¡Reserva confirmada, ${escapeHtml(params.name || '')}! 🎉</h2>
    <p>Hemos recibido la señal. Tu fecha queda reservada:</p>
    ${rows([
      ['Nº de reserva', `<strong>${escapeHtml(params.code)}</strong>`],
      ['Fecha', escapeHtml(formatDateEs(params.date))],
      ['Horario', escapeHtml(SLOT_LABELS[params.timeSlot] || params.timeSlot)],
      ['Señal pagada', `${escapeHtml(params.depositAmount)} €`],
      ['Pendiente', `${escapeHtml(remaining)} €`],
    ])}
    ${note(
      `<strong>El día del evento, antes de empezar:</strong> pagarás el resto (<strong>${escapeHtml(remaining)} €</strong>) con tarjeta, con un enlace o código QR en tu móvil o en nuestro datáfono, y se bloqueará una <strong>fianza de ${SECURITY_DEPOSIT_AMOUNT} €</strong> en tu tarjeta de crédito o débito. La fianza no es un cobro: la liberamos en cuanto revisamos el espacio (como máximo en 7 días). Con tarjeta de débito, ese importe queda retenido de tu saldo hasta entonces. <strong>Bizum no está disponible para el resto ni para la fianza.</strong>`
    )}
    ${CONTACT_HTML}`;
  return { subject: `Reserva ${params.code} confirmada - HappyHub`, html: layout('HappyHub', 'Reserva confirmada', body) };
}

/** Recordatorio 3 días antes del evento: el resto debe estar abonado antes de empezar */
export function remainingPaymentReminderEmail(params: {
  name: string;
  code: string;
  date: string;
  timeSlot: string;
  totalPrice: number;
  depositPaid: number;
  payUrl: string;
}): { subject: string; html: string } {
  const remaining = Math.round((params.totalPrice - params.depositPaid) * 100) / 100;
  const amount = escapeHtml(remaining);
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">¡Hola ${escapeHtml(params.name || '')}! Tu evento es en 3 días 🎉</h2>
    <p>Te recordamos que el resto de la reserva debe estar abonado <strong>antes del evento</strong>. Puedes pagarlo ya con tarjeta:</p>
    ${rows([
      ['Nº de reserva', `<strong>${escapeHtml(params.code)}</strong>`],
      ['Fecha', escapeHtml(formatDateEs(params.date))],
      ['Horario', escapeHtml(SLOT_LABELS[params.timeSlot] || params.timeSlot)],
      ['Precio total', `${escapeHtml(params.totalPrice)} €`],
      ['Señal pagada', `${escapeHtml(params.depositPaid)} €`],
      ['Pendiente', `<strong>${amount} €</strong>`],
    ])}
    <p style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(params.payUrl)}" style="background: #FF6B35; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Pagar ${amount} €</a>
    </p>
    ${note(`Si no lo pagas antes, tendrás que abonarlo el mismo día, antes de empezar. El día del evento, además, se bloquea una <strong>fianza de ${escapeHtml(SECURITY_DEPOSIT_AMOUNT)} €</strong> en tu tarjeta: no es un cobro y la liberamos en cuanto revisamos el espacio.`)}
    ${CONTACT_HTML}`;
  return {
    subject: `Tu evento es en 3 días: paga el resto de la reserva ${params.code} (${remaining} €)`,
    html: layout('HappyHub', 'Recordatorio de pago', body),
  };
}
