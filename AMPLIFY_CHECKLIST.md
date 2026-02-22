# Checklist Amplify - Solucionar Problemas

## Problema 1: Botón de Google no aparece

### Causa
Falta la variable `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`

### Solución
1. AWS Amplify Console → Tu app
2. **Environment variables** (menú izquierdo)
3. Click **Add variable**
4. Agregar:
   - Key: `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED`
   - Value: `true`
5. Click **Save**
6. Click **Redeploy this version** (arriba derecha)
7. Esperar build complete (3-5 min)

### Verificar
- En el build log debe aparecer: "Building..." con las variables
- Después del build, visita `/login` y debería aparecer el botón "Continuar con Google"

---

## Problema 2: Reset password da 404

### Posibles Causas
1. Build incompleto de Amplify
2. Configuración incorrecta de Next.js en Amplify
3. Variables de entorno faltantes

### Solución
1. Verificar que `reset-password.tsx` está en GitHub:
   ```
   git ls-tree -r origin/main --name-only | grep reset-password
   ```
   ✅ Ya verificado: SÍ está

2. En Amplify Console → Build settings:
   - Verificar que el framework detectado es: **Next.js - SSR**
   - NO debe ser "Next.js - Static HTML Export"

3. Si framework incorrecto, cambiar:
   - Click **Edit** en Build settings
   - Framework: Next.js - SSR
   - Build command: `npm run build`
   - Output directory: `.next`
   - Save

4. Redeploy completo:
   - Click **Redeploy this version**
   - Esperar 3-5 minutos

### Verificar
- Después del build, visita: `https://[tu-dominio].amplifyapp.com/reset-password`
- Debería mostrar la página de recuperación

---

## Variables Críticas en Amplify

Asegúrate de tener TODAS estas:

```
# Google OAuth (CRÍTICO para botón)
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth (CRÍTICO - cambiar localhost por tu URL)
NEXTAUTH_URL=https://main.XXXXX.amplifyapp.com
NEXTAUTH_SECRET=your-nextauth-secret-here

# JWT
JWT_SECRET=your-jwt-secret-here

# Database (ya deberías tenerlas)
DATABASE_URL=postgresql://...
DB_HOST=...
DB_PORT=5432
DB_NAME=neondb
DB_USER=...
DB_PASSWORD=...

# n8n
N8N_WEBHOOK_URL=...

# Stripe
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

---

## Si Aún No Funciona

### Ver logs de build
1. Amplify Console → Tu app
2. Click en el último build
3. Buscar errores en:
   - Provision
   - Build
   - Deploy

### Errores comunes
- `NEXT_PUBLIC_*` not found → Agregar variable y redeploy
- 404 en páginas → Framework incorrecto (debe ser SSR)
- Build fails → Verificar package.json y dependencies

---

## Después de Arreglar

Commits y deploy:
```bash
git add .
git commit -m "Add missing env var reference"
git push
```

Amplify debería auto-deploy en ~5 minutos.
