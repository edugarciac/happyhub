# Configuración N8N para Amplify - GUÍA RÁPIDA

## 🎯 URL Correcta de n8n

**Tu n8n está en:** `https://n8n.happyhub.es` (con HTTPS vía nginx)

**NO uses:** `http://52.208.80.224:5678` (la IP está bloqueada por firewall corporativo)

---

## ⚡ Configuración Rápida (5 minutos)

### Paso 1: Configurar Workflow en n8n

1. **Accede:** https://n8n.happyhub.es
   - Usuario: `admin`
   - Password: `ChangeThisPassword123!`

2. **Import workflow:**
   - Workflows → Import → Selecciona `n8n/workflows/reservation-approval-flow.json`
   - Click Import

3. **Activa el workflow:**
   - Toggle arriba a la derecha → **ON (verde)**

4. **Obtén la URL del webhook:**
   - Click en nodo "Webhook - New Reservation"
   - Copia la "Production URL":
   ```
   https://n8n.happyhub.es/webhook/reservation-new
   ```

### Paso 2: Configurar en AWS Amplify

**Amplify Console → Environment Variables:**

```bash
N8N_WEBHOOK_URL=https://n8n.happyhub.es/webhook/reservation-new
```

**Importante:**
- NO pongas solo `/webhook`
- Usa la URL completa que copiaste del nodo webhook
- Incluye `/reservation-new` al final

**Save → Redeploy this version**

---

## 🧪 Test Rápido

**Después del redeploy (~3 min):**

```bash
# Test webhook directamente
curl -X POST https://n8n.happyhub.es/webhook/reservation-new \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@test.com",
    "phone": "612345678",
    "customer_name": "Test User",
    "customer_email": "test@test.com",
    "customer_phone": "612345678",
    "event_date": "2026-03-15",
    "time_slot": "afternoon",
    "event_type": "cumpleaños",
    "guests": 30,
    "total_price": 185,
    "reservation_id": 999
  }'
```

**Debe responder:**
```json
{
  "success": true,
  "reservation_id": 999,
  "message": "Reserva recibida"
}
```

---

## ✅ Variables Completas para Amplify

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_zr5iRHB3pgLw@ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Auth
JWT_SECRET=happyhub-jwt-secret-2026
NEXTAUTH_URL=https://www.happyhub.es
NEXTAUTH_SECRET=happyhub-nextauth-secret-2026

# Google OAuth (ver .env.local para valores)
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-secret>
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true

# n8n (USA DOMINIO CON HTTPS)
N8N_WEBHOOK_URL=https://n8n.happyhub.es/webhook/reservation-new

# WhatsApp (ver .env.local para token completo)
WHATSAPP_API_TOKEN=<your-whatsapp-token>
```

---

## 📋 Checklist

- [ ] Entra a https://n8n.happyhub.es
- [ ] Importa workflow: `n8n/workflows/reservation-approval-flow.json`
- [ ] Activa workflow (toggle verde)
- [ ] Copia URL del webhook (nodo "Webhook - New Reservation")
- [ ] En Amplify: `N8N_WEBHOOK_URL=https://n8n.happyhub.es/webhook/reservation-new`
- [ ] Redeploy
- [ ] Test reserva en producción

---

## 🎯 Ventaja del Dominio

✅ HTTPS → Más seguro
✅ No bloqueado por firewall (dominio válido)
✅ Certificado SSL válido

**Tiempo total:** ~8 minutos (5 min n8n + 3 min deploy)
