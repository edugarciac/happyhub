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

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (11:00-14:30)',
  afternoon: 'Tarde (16:30-20:30)',
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

Resto pendiente: ${totalPrice - depositAmount}€ (a pagar el día del evento)

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
