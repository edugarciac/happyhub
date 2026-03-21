## Why

Los emails de verificación no se enviaban porque: (1) la variable `N8N_EMAIL_WEBHOOK_URL` apuntaba a un placeholder (`https://tu-n8n.com/...`), y (2) el nodo Gmail de n8n fallaba con "Forbidden" por tokens OAuth caducados. Además, los usuarios podían hacer login sin verificar su email, lo que invalidaba todo el flujo de verificación.

## What Changes

- **BREAKING**: Los usuarios con `email_verified = false` ya no pueden iniciar sesión. Reciben el mensaje "Debes verificar tu email antes de iniciar sesión"
- El workflow de n8n cambia de Gmail OAuth2 a SMTP con App Password (no caduca)
- Se corrige la URL del webhook en Vercel: `https://n8n.happyhub.es/webhook/send-verification-email`
- El campo `fromEmail` del nodo SMTP usa valor fijo `noreply@happyhub.es` en vez de `$env.SMTP_USER`

## Capabilities

### New Capabilities

- `email-verified-login-gate`: Bloqueo de login para usuarios sin email verificado
- `smtp-email-sending`: Envío de emails de verificación via SMTP en n8n

### Modified Capabilities

_(ninguna — no existían specs previas)_

## Impact

- `src/lib/auth.ts` — callback `authorize` de next-auth CredentialsProvider
- `n8n/n8n-nodes/n8n-email-verification.json` — workflow completo
- Configuración Vercel: variable `N8N_EMAIL_WEBHOOK_URL`
- Configuración n8n: nueva credencial SMTP (`smtp.gmail.com:465`)
