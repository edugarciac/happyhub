# 🚀 Configuración de Variables de Entorno en Vercel

## Variables Requeridas para Producción

Para que tu aplicación HappyHub funcione correctamente en producción (Vercel), necesitas configurar las siguientes variables de entorno:

### 1️⃣ En Vercel Dashboard

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Click en tu proyecto **happyhub**
3. Ve a **Settings** → **Environment Variables**
4. Añade las siguientes variables:

---

### 🔗 n8n Webhook (CRÍTICO)

```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request
```

> **Importante:** Esta variable es pública (NEXT_PUBLIC_) y se usa en el frontend para enviar las solicitudes de reserva directamente a n8n.

---

### 🔐 Authentication (Opcional - para login admin)

```
JWT_SECRET=tu_secreto_jwt_aqui
NEXTAUTH_SECRET=tu_secreto_nextauth_aqui
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

Para generar secretos seguros:
```bash
openssl rand -base64 32
```

---

### ☁️ AWS (Opcional - si usas S3 para archivos)

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[TU_ACCESS_KEY]
AWS_SECRET_ACCESS_KEY=[TU_SECRET_KEY]
S3_BUCKET=happyhub-assets-prod
```

> **Nota:** Usa las credenciales del archivo local `.env`

---

### 📊 Airtable (Opcional - solo si tienes endpoints que consultan Airtable desde backend)

```
AIRTABLE_PERSONAL_ACCESS_TOKEN=[VER_ARCHIVO_LOCAL_airtable-credentials.json]
AIRTABLE_BASE_ID=appAj3N7bMGIVBagd
AIRTABLE_TABLE_ID=tblGakVr6paaokq9N
```

> **Nota:** Estas NO son necesarias para el flujo de reservas, ya que n8n se encarga de toda la comunicación con Airtable.

---

### 💳 Stripe (Para futuro - pagos)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 🎯 Variables Mínimas Necesarias AHORA

Para que funcione el sistema de reservas, solo necesitas:

1. **NEXT_PUBLIC_N8N_WEBHOOK_URL** ✅ CRÍTICA

Eso es todo. Las demás son opcionales.

---

## 📝 Cómo añadir las variables en Vercel

### Método 1: Dashboard Web

1. Ve a: https://vercel.com/[tu-usuario]/happyhub/settings/environment-variables
2. Para cada variable:
   - **Key**: Nombre de la variable (ej: NEXT_PUBLIC_N8N_WEBHOOK_URL)
   - **Value**: Valor de la variable
   - **Environments**: Selecciona **Production**, **Preview**, y **Development**
3. Click **Save**

### Método 2: Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Añadir variables
vercel env add NEXT_PUBLIC_N8N_WEBHOOK_URL production
# Pega el valor cuando te lo pida

# O desde un archivo
cat .env | vercel env add
```

---

## 🔄 Después de añadir las variables

1. **Redeploy** tu aplicación:
   - Ve a **Deployments**
   - Click en los **...** del último deployment
   - Click **Redeploy**
   - O haz un nuevo commit y push a GitHub (auto-deploy)

2. **Verifica** que funcionan:
   - Abre tu sitio: https://tu-dominio.vercel.app
   - Abre la consola del navegador (F12)
   - Intenta hacer una reserva de prueba
   - Verifica que la request vaya a tu n8n

---

## ✅ Checklist de Deployment

- [ ] ✅ Variable `NEXT_PUBLIC_N8N_WEBHOOK_URL` configurada
- [ ] ✅ n8n workflows importados y activos
- [ ] ✅ Credenciales de n8n configuradas (Airtable, Google Calendar, SMTP)
- [ ] ✅ Application redeployada en Vercel
- [ ] ✅ Test de reserva desde el sitio en producción

---

## 🧪 Probar en Producción

1. Abre tu sitio: https://tu-dominio.vercel.app/reservas
2. Completa el formulario
3. Click "Solicitar Reserva"
4. **Verificar:**
   - ✅ Mensaje de éxito aparece en el frontend
   - ✅ En n8n → Executions, hay una nueva ejecución exitosa
   - ✅ En Airtable, aparece el nuevo registro
   - ✅ Recibes emails de confirmación

---

## 🐛 Troubleshooting

### Error: "N8N_WEBHOOK_URL no está configurada"

**Solución:** La variable debe llamarse `NEXT_PUBLIC_N8N_WEBHOOK_URL` (con el prefijo NEXT_PUBLIC_)

### Error: "Network Error" o "ERR_BLOCKED_BY_CLIENT"

**Solución:**
- Verifica que la URL de n8n sea accesible públicamente
- Verifica que no haya CORS bloqueando la request
- En n8n, el webhook debe tener "Authentication: None" para requests desde el navegador

### Error: Webhook no recibe datos

**Solución:**
- Verifica que el workflow esté **ACTIVO** en n8n
- Copia la URL del webhook del nodo en n8n y compárala con la variable de entorno
- Prueba el webhook con curl:
  ```bash
  curl -X POST https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@test.com","phone":"638390600","eventType":"cumpleaños","date":"2025-01-15","timeSlot":"afternoon","guests":50,"paymentMethod":"card","extras":[],"totalPrice":500}'
  ```

---

**Última actualización:** 26 de diciembre de 2024
