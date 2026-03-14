const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

function buildVerificationEmailHtml(name: string, verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">HappyHub</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="color:#1f2937;margin:0 0 16px;font-size:22px;">Verifica tu email</h2>
              <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Hola ${name}, gracias por registrarte en HappyHub. Para completar tu registro y poder realizar reservas, haz clic en el siguiente boton:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${verificationUrl}" style="display:inline-block;background-color:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Verificar mi email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0 0 8px;">
                Si el boton no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="color:#6366f1;font-size:13px;word-break:break-all;margin:0 0 24px;">
                ${verificationUrl}
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="color:#9ca3af;font-size:13px;margin:0;">
                Este enlace es valido durante 24 horas. Si no has solicitado este registro, puedes ignorar este email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                HappyHub - Tu espacio para celebrar
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;
  const html = buildVerificationEmailHtml(name, verificationUrl);

  // Try n8n webhook first
  const n8nUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
  if (n8nUrl) {
    try {
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: 'Verifica tu email - HappyHub',
          html,
          name,
          verificationUrl,
        }),
      });
      if (response.ok) {
        console.log('Verification email sent via n8n to:', email);
        return true;
      }
      console.warn('n8n webhook failed, status:', response.status);
    } catch (err) {
      console.warn('n8n webhook error:', err);
    }
  }

  // Development fallback: log to console
  console.log('=== VERIFICATION EMAIL (dev mode) ===');
  console.log(`To: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Verification URL: ${verificationUrl}`);
  console.log('=====================================');
  return true;
}
