## ADDED Requirements

### Requirement: Verification emails sent via SMTP
El sistema SHALL enviar emails de verificación mediante un nodo SMTP en n8n, en vez de Gmail OAuth2.

#### Scenario: Successful email delivery
- **WHEN** un usuario se registra con email y password
- **THEN** el sistema MUST enviar una petición POST al webhook `https://n8n.happyhub.es/webhook/send-verification-email`
- **THEN** n8n MUST enviar el email via SMTP (`smtp.gmail.com:465`) con la credencial `SMTP Happyhub`

#### Scenario: n8n webhook not reachable
- **WHEN** el webhook de n8n no responde o devuelve error
- **THEN** el sistema MUST loguear el error en consola
- **THEN** el usuario MUST ver la página de verificación pendiente (el registro no falla)

### Requirement: SMTP credential does not expire
La credencial SMTP SHALL usar Gmail App Password, que no caduca (a diferencia de tokens OAuth2).

#### Scenario: Email sent after 30 days
- **WHEN** han pasado más de 30 días desde la configuración de la credencial SMTP
- **THEN** el sistema MUST seguir enviando emails correctamente sin re-autenticación

### Requirement: Webhook URL configured in Vercel
La variable de entorno `N8N_EMAIL_WEBHOOK_URL` SHALL apuntar a `https://n8n.happyhub.es/webhook/send-verification-email`.

#### Scenario: Environment variable set correctly
- **WHEN** el servidor procesa un registro
- **THEN** el sistema MUST usar el valor de `N8N_EMAIL_WEBHOOK_URL` para enviar la petición al webhook
