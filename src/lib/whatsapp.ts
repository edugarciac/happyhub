import axios from 'axios';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
}

function getConfig(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.log('WhatsApp not configured - missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return null;
  }

  return { phoneNumberId, accessToken };
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, assume Spanish number and add 34
  if (cleaned.startsWith('0')) {
    cleaned = '34' + cleaned.slice(1);
  }

  // If doesn't start with country code, assume Spanish
  if (!cleaned.startsWith('34') && cleaned.length === 9) {
    cleaned = '34' + cleaned;
  }

  return cleaned;
}

interface TemplateMessageParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

export async function sendTemplateMessage({
  to,
  templateName,
  languageCode = 'es',
  components = [],
}: TemplateMessageParams): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  const formattedPhone = formatPhoneNumber(to);

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('WhatsApp template message sent:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error sending WhatsApp template message:', error.response?.data || error.message);
    return false;
  }
}

interface TextMessageParams {
  to: string;
  message: string;
}

export async function sendTextMessage({ to, message }: TextMessageParams): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  const formattedPhone = formatPhoneNumber(to);

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('WhatsApp text message sent:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error sending WhatsApp text message:', error.response?.data || error.message);
    return false;
  }
}

interface ReservationConfirmationParams {
  phone: string;
  name: string;
  date: string;
  timeSlot: string;
  guests: number;
  totalPrice: number;
  depositAmount: number;
  reservationId: string;
  contractUrl?: string;
}

export const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (10:00-14:00)',
  afternoon: 'Tarde (16:00-20:00)',
  night: 'Noche (22:00-02:00)',
};

export async function sendReservationConfirmation({
  phone,
  name,
  date,
  timeSlot,
  guests,
  totalPrice,
  depositAmount,
  reservationId,
  contractUrl,
}: ReservationConfirmationParams): Promise<boolean> {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const message = `🎉 *¡Reserva Confirmada!*

Hola ${name}, tu reserva en HappyHub ha sido confirmada.

📅 *Fecha:* ${formattedDate}
⏰ *Horario:* ${TIME_SLOT_LABELS[timeSlot] || timeSlot}
👥 *Invitados:* ${guests} personas
💰 *Total:* ${totalPrice}€
✅ *Señal pagada:* ${depositAmount}€
📝 *Nº Reserva:* ${reservationId}

${contractUrl ? `📄 Contrato: ${contractUrl}` : ''}

Resto pendiente: ${totalPrice - depositAmount}€ (a pagar antes de comenzar el evento)

¿Tienes preguntas? Responde a este mensaje o escríbenos por WhatsApp al 624 645 517.

¡Nos vemos pronto! 🎈`;

  return sendTextMessage({ to: phone, message });
}

interface ReminderParams {
  phone: string;
  name: string;
  date: string;
  timeSlot: string;
  reservationId: string;
}

export async function sendReservationReminder({
  phone,
  name,
  date,
  timeSlot,
  reservationId,
}: ReminderParams): Promise<boolean> {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const message = `⏰ *Recordatorio de tu reserva*

Hola ${name}, te recordamos que tu evento en HappyHub es en 7 días.

📅 *Fecha:* ${formattedDate}
⏰ *Horario:* ${TIME_SLOT_LABELS[timeSlot] || timeSlot}
📝 *Nº Reserva:* ${reservationId}

No olvides preparar todo lo necesario para tu celebración.

Si tienes alguna pregunta o necesitas hacer cambios, escríbenos por WhatsApp al 624 645 517.

¡Te esperamos! 🎉`;

  return sendTextMessage({ to: phone, message });
}

// Send notification to admin
export async function sendAdminNotification(message: string): Promise<boolean> {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminPhone) {
    console.log('Admin WhatsApp number not configured');
    return false;
  }

  return sendTextMessage({ to: adminPhone, message });
}

export async function notifyAdminNewReservation({
  name,
  date,
  timeSlot,
  guests,
  totalPrice,
  depositAmount,
  reservationId,
}: Omit<ReservationConfirmationParams, 'phone' | 'contractUrl'>): Promise<boolean> {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const message = `🆕 *Nueva Reserva Confirmada*

📝 *Nº:* ${reservationId}
👤 *Cliente:* ${name}
📅 *Fecha:* ${formattedDate}
⏰ *Horario:* ${TIME_SLOT_LABELS[timeSlot] || timeSlot}
👥 *Invitados:* ${guests}
💰 *Total:* ${totalPrice}€
✅ *Señal:* ${depositAmount}€`;

  return sendAdminNotification(message);
}

// Sent right when a reservation request comes in (before payment/approval) —
// distinct wording from notifyAdminNewReservation (which fires on payment
// success) so the admin isn't told twice that something is "confirmed".
export async function notifyAdminReservationRequest({
  name,
  date,
  timeSlot,
  guests,
  totalPrice,
  depositAmount,
  reservationId,
  needsKidsFurniture,
  isHoliday,
}: Omit<ReservationConfirmationParams, 'phone' | 'contractUrl'> & { needsKidsFurniture?: boolean; isHoliday?: boolean }): Promise<boolean> {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const kidsFurnitureLine = needsKidsFurniture ? '\n🪑 *Mesas/sillas niños:* Sí' : '';
  const holidayHeader = isHoliday
    ? '🎉 *FESTIVO — requiere confirmación caso a caso, no se ha cobrado ninguna señal*\n\n'
    : '';

  const message = `${holidayHeader}🆕 *Nueva solicitud de reserva*

📝 *Nº:* ${reservationId}
👤 *Cliente:* ${name}
📅 *Fecha:* ${formattedDate}
⏰ *Horario:* ${TIME_SLOT_LABELS[timeSlot] || timeSlot}
👥 *Invitados:* ${guests}
💰 *Total:* ${totalPrice}€
🔖 *Señal:* ${depositAmount}€${kidsFurnitureLine}

Revísala en el panel de administración.`;

  return sendAdminNotification(message);
}

// Format reservation for admin approval notification
interface AdminApprovalNotificationParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  timeSlot: string;
  eventType: string;
  guests: number;
  totalPrice: number;
  reservationId: number;
}

export function formatReservationForAdmin({
  customerName,
  customerEmail,
  customerPhone,
  eventDate,
  timeSlot,
  eventType,
  guests,
  totalPrice,
  reservationId,
}: AdminApprovalNotificationParams): string {
  const date = new Date(eventDate);
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return `🆕 *Nueva Reserva #${reservationId}*

👤 ${customerName}
📧 ${customerEmail}
📞 ${customerPhone}

📅 Fecha: ${formattedDate}
⏰ Horario: ${TIME_SLOT_LABELS[timeSlot] || timeSlot}
🎉 Tipo: ${eventType}
👥 Invitados: ${guests}
💰 Precio: ${totalPrice}€

👉 Revisar y aprobar:
https://www.happyhub.es/admin/approve-reservation/${reservationId}`;
}

export async function sendAdminApprovalNotification(params: AdminApprovalNotificationParams): Promise<boolean> {
  const message = formatReservationForAdmin(params);
  const adminPhone = '34624645517'; // HappyHub business number
  return sendTextMessage({ to: adminPhone, message });
}

// Customer notifications for approval/rejection
export async function sendApprovalNotificationToCustomer({
  phone,
  name,
  date,
  timeSlot,
  reservationId,
}: ReminderParams & { name: string }): Promise<boolean> {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const message = `✅ *¡Reserva Aprobada!*

Hola ${name}, tu reserva en HappyHub ha sido aprobada.

📝 *Nº Reserva:* ${reservationId}
📅 *Fecha:* ${formattedDate}
⏰ *Horario:* ${TIME_SLOT_LABELS[timeSlot] || timeSlot}

En breve recibirás el enlace de pago para completar tu reserva.

¿Dudas? Escríbenos al 624 645 517

¡Nos vemos pronto! 🎉`;

  return sendTextMessage({ to: phone, message });
}

export async function sendRejectionNotificationToCustomer({
  phone,
  name,
  reason,
}: {
  phone: string;
  name: string;
  reason: string;
}): Promise<boolean> {
  const message = `❌ *Reserva No Disponible*

Hola ${name}, lamentamos informarte que tu solicitud de reserva no puede ser procesada.

*Motivo:* ${reason}

Te invitamos a:
- Elegir otra fecha en www.happyhub.es/disponibilidad
- Contactarnos por WhatsApp para buscar alternativas

Estamos aquí para ayudarte: 624 645 517

Saludos,
Equipo HappyHub`;

  return sendTextMessage({ to: phone, message });
}
