## Context

El flujo de verificación de email estaba roto en dos niveles:
1. **Envío**: El workflow de n8n usaba Gmail OAuth2, cuyos tokens caducan cada 7 días en apps en modo "Testing". La URL del webhook era un placeholder.
2. **Enforcement**: El login con next-auth permitía acceso a usuarios con `email_verified = false`, haciendo inútil todo el flujo de verificación.

Flujo actual: Registro → crear usuario (`email_verified=false`) → enviar email → usuario verifica → `email_verified=true`.

## Goals / Non-Goals

**Goals:**
- Garantizar que los emails de verificación se envían correctamente via SMTP
- Bloquear login para usuarios que no han verificado su email
- Eliminar dependencia de tokens OAuth que caducan

**Non-Goals:**
- No se cambia el flujo de registro (el usuario se crea con `email_verified=false`, esto es correcto)
- No se implementa verificación por SMS o doble factor
- No se migra el envío de emails fuera de n8n (se mantiene n8n como email gateway)

## Decisions

### SMTP con App Password en vez de Gmail OAuth2

**Decisión**: Cambiar el nodo de n8n de `gmail` (OAuth2) a `emailSend` (SMTP) con Gmail App Password.

**Alternativa considerada**: Re-autenticar OAuth2 y publicar la app en Google Cloud.

**Rationale**: App Passwords no caducan nunca. OAuth2 en modo testing caduca cada 7 días, y aunque la app ya está publicada, SMTP es más simple y fiable para un servicio backend sin interacción de usuario.

### Bloquear login en authorize callback

**Decisión**: Añadir check de `email_verified` en el callback `authorize` del CredentialsProvider de next-auth.

**Alternativa considerada**: Verificar en el callback `signIn` o en middleware.

**Rationale**: El callback `authorize` es el punto más temprano y natural para rechazar credenciales. El error se muestra en la página de login automáticamente via next-auth error handling.

### fromEmail fijo en el workflow

**Decisión**: Usar `noreply@happyhub.es` como valor fijo en vez de `$env.SMTP_USER`.

**Rationale**: n8n denegaba acceso a variables de entorno (`access to env vars denied`). Un valor fijo es suficiente para este caso de uso.

## Risks / Trade-offs

- [Gmail App Password] → Vinculada a una cuenta personal de Gmail. Si la cuenta se desactiva, los emails dejan de enviarse. Mitigación: monitorizar errores en n8n.
- [Usuarios existentes sin verificar] → Los usuarios ya creados con `email_verified=false` no podrán hacer login. Mitigación: pueden usar "Reenviar email de verificación" desde `/verificacion-pendiente`.
- [fromEmail noreply@happyhub.es] → Sin dominio email propio configurado, Gmail enviará desde la cuenta real del SMTP. El `from` se ignora en Gmail SMTP si no es un alias verificado.
