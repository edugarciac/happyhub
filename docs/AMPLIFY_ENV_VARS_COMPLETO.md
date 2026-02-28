# Variables de Entorno Completas para AWS Amplify

Copia estas variables EXACTAMENTE en AWS Amplify Console → Environment Variables

## ⚠️ CRÍTICAS (Sin estas NO funciona)

```bash
# Database - Neon PostgreSQL (CRÍTICO - causa timeout sin esto)
DATABASE_URL=postgresql://neondb_owner:npg_zr5iRHB3pgLw@ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Auth - JWT (CRÍTICO para login)
JWT_SECRET=your-jwt-secret-change-in-production
NEXTAUTH_URL=https://www.happyhub.es
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
```

## 🔐 Google OAuth2 (Configurado 2026-02-28)

```bash
GOOGLE_CLIENT_ID=<ver .env.local - 1090903509602-bgus...apps.googleusercontent.com>
GOOGLE_CLIENT_SECRET=<ver .env.local - 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>
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
```

**⚠️ Valores reales almacenados en:**
- Local: `.env.local` (gitignored)
- Documentación: `docs/GOOGLE_OAUTH_CREDENTIALS.md` (gitignored)

## 📱 WhatsApp Business API

```bash
WHATSAPP_API_TOKEN=EAAXSgOo4ZA0oBQ5fZCCHCFXFpFZA3reZC8btEFw7G4fsauu2yhkZBSy2WhMHJTI0dc6Ps6HsjLZBTLXZADyZByoBI4DQ0aVtNi2h7P99V5owzqZBYCleWb9rlZCZBQnb1KlqXcZAwoXPxg9HVggWIFvlBXkIOSeWwvTMhQwPOLBDnxA40MFdgSKbZBdOsFOEA2cNLd6bsvCPnzbzOuNJucb5C3Gplk6a6oVhvD9Or70ZCEZAk8ADVRD6FTcZC3ws9g01Wq1ekARe6R0EY8PolQd11KSSFkwz
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id-aqui
```

## 🔔 n8n Workflow

```bash
N8N_WEBHOOK_URL=http://52.208.80.224:5678/webhook
```

## 💳 Stripe (Si lo usas)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 📝 Pasos en Amplify Console

1. **Login:** https://console.aws.amazon.com/amplify/
2. **Selecciona app:** HappyHub
3. **Menu izquierdo:** Environment variables
4. **Click:** Manage variables
5. **Añade cada variable** de arriba (una por una)
6. **Save**
7. **Redeploy this version**
8. **Espera:** 3-5 minutos
9. **Test:** https://www.happyhub.es/login

---

## ✅ Verificación Post-Deploy

**Test login:**
```
URL: https://www.happyhub.es/login
Email: admin@happyhub.es
Password: admin123
```

**Debe:**
- ✅ No dar timeout error
- ✅ Mostrar botón "Sign in with Google"
- ✅ Login con email/password funciona
- ✅ Redirect a /admin/dashboard

**Si sigue con timeout:**
- Verifica DATABASE_URL está exactamente como arriba
- Verifica no tiene espacios extra
- Check build logs en Amplify

---

## 🔒 Seguridad

- ✅ `.env.local` en .gitignore (no se sube a git)
- ✅ Credenciales documentadas en archivo gitignored
- ✅ Variables en Amplify encriptadas por AWS
- ⚠️ Cambia JWT_SECRET y NEXTAUTH_SECRET con valores seguros:
  ```bash
  openssl rand -base64 32
  ```

---

## 📋 Checklist

- [ ] DATABASE_URL configurada en Amplify
- [ ] JWT_SECRET configurado en Amplify
- [ ] NEXTAUTH_URL = https://www.happyhub.es
- [ ] NEXTAUTH_SECRET configurado (genera con openssl)
- [ ] GOOGLE_CLIENT_ID configurado
- [ ] GOOGLE_CLIENT_SECRET configurado
- [ ] NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
- [ ] WHATSAPP_API_TOKEN configurado
- [ ] N8N_WEBHOOK_URL configurado
- [ ] Redeploy realizado
- [ ] Test login funciona sin timeout
