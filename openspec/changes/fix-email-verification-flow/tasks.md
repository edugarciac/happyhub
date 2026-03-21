## 1. Bloqueo de login sin verificación

- [x] 1.1 Añadir check `email_verified` en callback `authorize` de CredentialsProvider (`src/lib/auth.ts`)
- [x] 1.2 Devolver error descriptivo: "Debes verificar tu email antes de iniciar sesión"

## 2. Migración n8n de Gmail OAuth a SMTP

- [x] 2.1 Cambiar tipo de nodo de `n8n-nodes-base.gmail` a `n8n-nodes-base.emailSend` en `n8n-email-verification.json`
- [x] 2.2 Actualizar parámetros del nodo (fromEmail, toEmail, emailFormat, html)
- [x] 2.3 Cambiar credenciales de `gmailOAuth2` a `smtp` (SMTP Happyhub)
- [x] 2.4 Usar valor fijo `noreply@happyhub.es` en fromEmail (en vez de `$env.SMTP_USER`)

## 3. Configuración de infraestructura

- [x] 3.1 Crear App Password en Google Account para Gmail SMTP
- [x] 3.2 Crear credencial SMTP en n8n (smtp.gmail.com:465, SSL)
- [x] 3.3 Actualizar `N8N_EMAIL_WEBHOOK_URL` en Vercel a `https://n8n.happyhub.es/webhook/send-verification-email`
- [x] 3.4 Publicar app OAuth en Google Cloud Console (evitar caducidad de tokens para Calendar)

## 4. Verificación

- [x] 4.1 Testar envío de email de verificación desde n8n
- [x] 4.2 Verificar que usuario sin email verificado no puede hacer login
- [x] 4.3 Verificar que usuario verificado puede hacer login normalmente
