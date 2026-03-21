## ADDED Requirements

### Requirement: Login blocked for unverified email
El sistema SHALL rechazar el login de usuarios cuyo campo `email_verified` sea `false` en la tabla `users`.

#### Scenario: Unverified user tries to login
- **WHEN** un usuario con `email_verified = false` intenta iniciar sesión con credenciales correctas
- **THEN** el sistema MUST rechazar el login con el mensaje "Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada."

#### Scenario: Verified user logs in successfully
- **WHEN** un usuario con `email_verified = true` intenta iniciar sesión con credenciales correctas
- **THEN** el sistema MUST permitir el login y crear la sesión normalmente

#### Scenario: Wrong credentials still show generic error
- **WHEN** un usuario (verificado o no) introduce credenciales incorrectas
- **THEN** el sistema MUST mostrar "Email o contraseña incorrectos" (sin revelar si el email existe)

### Requirement: Google OAuth users bypass email verification
Los usuarios que se registran via Google OAuth SHALL tener `email_verified = true` automáticamente, ya que Google ya verifica el email.

#### Scenario: Google OAuth registration
- **WHEN** un usuario se registra via Google OAuth
- **THEN** el sistema MUST crear el usuario con `email_verified = true`
- **THEN** el sistema MUST permitir login inmediato sin verificación adicional
