// Plantillas HTML de los correos transaccionales (adaptadas de los workflows de n8n)

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

/** Id visible de la reserva, mismo formato que generaba n8n: RES-YYYYMMDD-NNN */
export function buildReservationCode(date: string, dbId: number): string {
  return `RES-${date.replace(/-/g, '')}-${String(dbId).padStart(3, '0')}`;
}

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
  eventType: string;
  paymentMethod: string;
  totalPrice: number;
  depositAmount: number;
  message?: string;
  needsKidsFurniture?: boolean;
  isHoliday?: boolean;
  dbId?: number;
}

export function reservationCustomerEmail(r: ReservationEmailData): { subject: string; html: string } {
  const body = `<h2 style="color: #FF6B35; margin-top: 0;">¡Hola ${escapeHtml(r.name)}!</h2>
    <p>Hemos recibido tu solicitud de reserva. Este es el resumen:</p>
    ${rows([
      ['Nº de reserva', `<strong>${escapeHtml(r.code)}</strong>`],
      ['Fecha', escapeHtml(formatDateEs(r.date))],
      ['Horario', escapeHtml(SLOT_LABELS[r.timeSlot] || r.timeSlot)],
      ['Invitados', `${escapeHtml(r.guests)} personas`],
      ['Tipo de evento', escapeHtml(EVENT_TYPE_LABELS[r.eventType] || r.eventType)],
      ['Método de pago', escapeHtml(PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod)],
      ['Precio total', `<strong style="font-size: 18px;">${escapeHtml(r.totalPrice)} €</strong>`],
      ['Señal (30%)', `<strong style="color: #FF6B35;">${escapeHtml(r.depositAmount)} €</strong>`],
    ])}
    ${note(
      r.isHoliday
        ? '<strong>Próximos pasos:</strong> al ser festivo, revisaremos tu solicitud caso a caso y te contactaremos en los próximos días.'
        : '<strong>Próximos pasos:</strong> revisaremos tu solicitud y te contactaremos en los próximos días para confirmar los detalles y el pago de la señal.'
    )}
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
      ['Horario', escapeHtml(SLOT_LABELS[r.timeSlot] || r.timeSlot)],
      ['Tipo', escapeHtml(EVENT_TYPE_LABELS[r.eventType] || r.eventType)],
      ['Invitados', `${escapeHtml(r.guests)} personas`],
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
