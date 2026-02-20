# Configuración de Google OAuth

Guía para configurar la autenticación con Google en HappyHub.

## Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Crea un nuevo proyecto o selecciona uno existente:
   - Nombre: **HappyHub**
   - ID del proyecto: (se genera automáticamente)

## Paso 2: Habilitar Google+ API

1. En el menú lateral, ve a **"APIs & Services"** > **"Library"**
2. Busca **"Google+ API"**
3. Haz clic en **"Enable"**

## Paso 3: Configurar Pantalla de Consentimiento OAuth

1. Ve a **"APIs & Services"** > **"OAuth consent screen"**
2. Selecciona **"External"** (para usuarios de cualquier cuenta de Google)
3. Completa la información:
   - **App name:** HappyHub
   - **User support email:** tu@email.com
   - **Developer contact:** tu@email.com
4. Haz clic en **"Save and Continue"**
5. En **"Scopes"**, agrega:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Haz clic en **"Save and Continue"**
7. En **"Test users"** (opcional para desarrollo):
   - Agrega tus emails de prueba
8. Haz clic en **"Save and Continue"**

## Paso 4: Crear Credenciales OAuth 2.0

1. Ve a **"APIs & Services"** > **"Credentials"**
2. Haz clic en **"Create Credentials"** > **"OAuth client ID"**
3. Configura:
   - **Application type:** Web application
   - **Name:** HappyHub Auth

4. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://www.happyhub.es
   https://main.du3to83rdme3o.amplifyapp.com
   ```

5. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://www.happyhub.es/api/auth/callback/google
   https://main.du3to83rdme3o.amplifyapp.com/api/auth/callback/google
   ```

6. Haz clic en **"Create"**

7. **Copia las credenciales:**
   - Client ID: `123456789-abc...apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abc...`

## Paso 5: Configurar Variables de Entorno

### Local (desarrollo)

Edita `.env` y agrega:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tu-client-secret-aqui

# NextAuth (si no existe)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-nextauth-secret-aqui
```

**Generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Producción (AWS Amplify)

En la consola de AWS Amplify, agrega las mismas variables:

```
GOOGLE_CLIENT_ID = tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-tu-secret
NEXTAUTH_URL = https://www.happyhub.es
NEXTAUTH_SECRET = tu-secret-de-produccion
```

**⚠️ IMPORTANTE:**
- Usa un `NEXTAUTH_SECRET` diferente para producción
- Asegúrate de que `NEXTAUTH_URL` coincida con tu dominio de producción

## Paso 6: Probar el Flujo OAuth

### En desarrollo:

1. Inicia el servidor: `npm run dev`
2. Ve a: http://localhost:3000/login
3. Haz clic en **"Continuar con Google"**
4. Selecciona tu cuenta de Google
5. Autoriza el acceso
6. Deberías ser redirigido a la página principal con sesión iniciada

### Verificar que funciona:

- Usuario nuevo → Se crea cuenta automáticamente
- Usuario existente → Inicia sesión con cuenta existente
- Perfil de Google (nombre, email) se importa automáticamente

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solución:** Verifica que la URI de redirección en Google Console sea exactamente:
```
http://localhost:3000/api/auth/callback/google
```
(sin barra final)

### Error: "invalid_client"
**Solución:**
- Verifica `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`
- Asegúrate de copiar las credenciales completas

### Error: "access_denied"
**Solución:**
- Verifica que el email esté en la lista de "Test users" (si la app está en modo test)
- O publica la app para que cualquiera pueda usarla

### Google Sign-In no aparece
**Solución:**
- Verifica que las variables `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén configuradas
- Reinicia el servidor después de agregar las variables

## Publicar la App (Opcional)

Si quieres que cualquier usuario de Google pueda registrarse (no solo test users):

1. En **"OAuth consent screen"**
2. Haz clic en **"Publish App"**
3. Confirma la publicación
4. La app estará disponible para todos los usuarios de Google

## Modo de Prueba vs Producción

**Modo de prueba (default):**
- Solo usuarios en "Test users" pueden autenticarse
- Límite de 100 usuarios
- Bueno para desarrollo

**Modo publicado:**
- Cualquier usuario de Google puede autenticarse
- Sin límites
- Requiere revisión de Google si solicitas scopes sensibles

---

**Última actualización:** 2026-02-20
**Versión:** 1.0.0
