# 🚀 Guía Configuración Rápida n8n - HappyHub

**Tiempo estimado:** 15 minutos
**Fecha:** 2026-02-22

## ✅ Pre-requisitos

- Acceso a n8n: https://n8n-n8n.ljmvxa.easypanel.host
- Usuario: edu.garciac@gmail.com
- Contraseña: Myene8ene@1

## 📋 Paso 1: Importar Workflow Actualizado (2 min)

1. **Abrir n8n**: https://n8n-n8n.ljmvxa.easypanel.host
2. **Login** con tus credenciales
3. Click en **"⋮"** (menú arriba derecha) → **"Import from file"**
4. Seleccionar archivo: `n8n/n8n-nodes/n8n-reserva-neon-whatsapp.json`
5. Click **"Import"**
6. El workflow aparecerá con nombre: **"HappyHub - Reservas con Neon + WhatsApp"**

✅ Workflow importado

---

## 🔑 Paso 2: Configurar Credenciales (10 min)

### A) PostgreSQL (Neon) - CRÍTICO ⭐

1. **Settings** → **Credentials** → **"+ New Credential"**
2. Buscar y seleccionar: **"Postgres"**
3. Llenar formulario:

```
Name: Neon HappyHub
Host: ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech
Port: 5432
Database: neondb
User: neondb_owner
Password: npg_zr5iRHB3pgLw
SSL Mode: require
```

4. Click **"Test"** → Debe decir "Connected successfully"
5. Click **"Save"**

✅ Neon configurado

### B) Google Calendar OAuth2

1. **"+ New Credential"** → **"Google Calendar OAuth2 API"**
2. Click **"Connect my account"**
3. Autorizar con tu cuenta Google
4. Dar permisos a Calendar
5. **Name:** "Google Calendar HappyHub"
6. Click **"Save"**

✅ Google Calendar configurado

### C) WhatsApp Business API (Variables de Entorno)

**Opción 1: Hardcodear en los nodos (más fácil)**

Editar cada nodo de WhatsApp y reemplazar:
- `{{ $env.WHATSAPP_PHONE_NUMBER_ID }}` → Tu Phone Number ID real
- `{{ $env.WHATSAPP_ACCESS_TOKEN }}` → Tu Access Token real
- `{{ $env.ADMIN_WHATSAPP_NUMBER }}` → +34624645517

**Opción 2: Variables de entorno (si tienes acceso)**

Si puedes editar variables de entorno en n8n:
- Settings → Environment Variables
- Añadir:
  ```
  WHATSAPP_PHONE_NUMBER_ID=123456789012345
  WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxx
  ADMIN_WHATSAPP_NUMBER=+34624645517
  ```

---

## 🔌 Paso 3: Conectar Credenciales a Nodos (3 min)

Volver al workflow y editar estos nodos:

### 1. Nodo "Verificar Disponibilidad (Neon)"
- Click en el nodo
- **Credential to connect with:** Seleccionar "Neon HappyHub"
- ✅ Save

### 2. Nodo "Guardar en Neon DB"
- Click en el nodo
- **Credential to connect with:** Seleccionar "Neon HappyHub"
- ✅ Save

### 3. Nodo "Crear Evento Calendar"
- Click en el nodo
- **Credential to connect with:** Seleccionar "Google Calendar HappyHub"
- ✅ Save

### 4. Nodos "WhatsApp Cliente" y "WhatsApp Admin"
- Click en cada nodo
- Verificar que las credenciales de WhatsApp están configuradas
- Si usaste Opción 1, verificar que los valores están hardcodeados
- ✅ Save

---

## ⚡ Paso 4: Activar Workflow

1. Click en el **toggle "Active"** arriba a la derecha
2. Debe cambiar a verde
3. El webhook ahora está disponible en:
   ```
   https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request
   ```

✅ Workflow activo

---

## 🧪 Paso 5: Probar el Workflow

### Test desde Terminal

```bash
curl -X POST https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Usuario",
    "email": "test@example.com",
    "phone": "+34666555444",
    "eventType": "cumpleaños",
    "date": "2026-03-20",
    "time": "16:30",
    "timeSlot": "afternoon",
    "guests": 25,
    "duration": "4",
    "extras": ["catering"],
    "basePrice": 185,
    "totalPrice": 560,
    "depositAmount": 168,
    "source": "web",
    "timestamp": "2026-02-22T20:00:00Z"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "reservationId": "RES-20260320-001",
  "message": "Reserva creada exitosamente"
}
```

### Test desde Frontend

1. Ir a: http://localhost:3000/reservas
2. Completar los 3 pasos
3. Click "Solicitar reserva"
4. Deberías ver el paso 4 de confirmación

---

## ❗ Si WhatsApp NO Funciona (Temporal)

**Opción A: Desactivar WhatsApp temporalmente**

Puedes desconectar los nodos de WhatsApp del flujo principal:

1. En el workflow, click en el nodo "Preparar Respuesta"
2. Desconectar las flechas que van a "WhatsApp Cliente" y "WhatsApp Admin"
3. Conectar directamente "Preparar Respuesta" → "Respuesta: Éxito"

Así funcionará todo EXCEPTO WhatsApp (tendrás BD, Calendar, y respuesta)

**Opción B: Usar SMS o Email como alternativa**

Reemplazar los nodos de WhatsApp por:
- Nodo "Send Email" (SMTP)
- O nodo "Twilio" para SMS

---

## 🎯 Orden de Prioridad

Si no tienes todo configurado aún:

### Mínimo para Funcionar (AHORA)
1. ✅ Neon PostgreSQL (ya configurado)
2. ✅ Google Calendar OAuth2
3. ✅ Webhook activo

### Añadir Después
4. ⏳ WhatsApp Business API
5. ⏳ Email SMTP
6. ⏳ Stripe Payment Links

---

## 🔍 Ver Ejecuciones en n8n

Para debug:
1. En n8n, click **"Executions"** (menú izquierdo)
2. Verás todas las ejecuciones del workflow
3. Click en una para ver detalles paso a paso
4. Los errores aparecerán en rojo

---

## 📞 Credenciales de WhatsApp Business

Si aún no tienes WhatsApp configurado:

1. **Meta Business Suite:** https://business.facebook.com
2. **Crear cuenta Business**
3. **Configurar WhatsApp:**
   - Settings → WhatsApp accounts → Add
   - Verificar número de teléfono
4. **Obtener credenciales:**
   - Phone Number ID: En WhatsApp API settings
   - Access Token: En System Users o directamente en API Setup

---

## ✅ Checklist Final

- [ ] Workflow importado en n8n
- [ ] Credencial "Neon HappyHub" creada y testeada
- [ ] Credencial "Google Calendar HappyHub" autorizada
- [ ] Nodos conectados con sus credenciales
- [ ] Workflow activado (toggle verde)
- [ ] Test con curl exitoso
- [ ] Test desde frontend http://localhost:3000/reservas

---

**¿Necesitas ayuda con algún paso específico?**
