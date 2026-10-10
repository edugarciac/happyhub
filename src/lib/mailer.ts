// Envío de correos transaccionales con Resend (https://resend.com/docs/api-reference/emails/send-email)

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'HappyHub <hola@happyhub.es>';
const DEFAULT_ADMIN_EMAILS = 'hola@happyhub.es,happyhub.rovellat@gmail.com';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Envía un correo. Nunca lanza: devuelve false si no se pudo enviar. */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[mailer] RESEND_API_KEY not configured - email not sent:', subject);
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[mailer] Resend error', res.status, await res.text().catch(() => ''), '-', subject);
      return false;
    }

    const data = await res.json().catch(() => ({}));
    console.log('[mailer] Email sent:', subject, '-> id', data?.id);
    return true;
  } catch (err) {
    console.error('[mailer] Error sending email:', subject, err);
    return false;
  }
}
