# 🚀 Inicio Rápido - Flujo n8n HappyHub

Guía express para poner en marcha el sistema de reservas en 10 minutos.

## ✅ Pre-requisitos

Antes de empezar, asegúrate de tener:

- [ ] Acceso a n8n: `https://n8n-n8n.ljmvxa.easypanel.host`
- [ ] Cuenta de Google con Google Calendar activado
- [ ] Cuenta de Airtable (gratis)
- [ ] Cuenta de Stripe (modo test está bien)
- [ ] Cuenta de Anthropic (Claude API)
- [ ] Servidor SMTP configurado (Gmail, SendGrid, etc.)

## 📋 Paso a Paso (10 minutos)

### 1. Importar el Flujo (1 min)

1. Acceder a n8n
2. Clic en **☰** (menú) → **Import from file**
3. Seleccionar: `n8n-reserva-con-validacion.json`
4. Clic en **Import**

✅ El flujo debería aparecer en tu workspace

---

### 2. Configurar Google Calendar (2 min)

1. En n8n, ir a **Settings** → **Credentials**
2. Clic en **Add Credential** → Buscar **Google Calendar OAuth2 API**
3. Configurar:
   - Copiar **Redirect URL** de n8n
   - Ir a [Google Cloud Console](https://console.cloud.google.com)
   - Crear proyecto nuevo: "HappyHub"
   - Activar **Google Calendar API**
   - Crear credenciales OAuth 2.0
   - Agregar **Redirect URL** de n8n
   - Copiar **Client ID** y **Client Secret**
   - Pegar en n8n
4. Clic en **Connect my account** → Autorizar
5. Guardar como: **"Google Calendar HappyHub"**

---

### 3. Configurar Airtable (2 min)

1. Ir a [Airtable](https://airtable.com)
2. Crear nueva base: **"HappyHub Reservas"**
3. Crear tabla: **"Reservas"** con estos campos:

| Campo | Tipo |
|-------|------|
| Nombre | Single line text |
| Email | Email |
| Teléfono | Phone number |
| Fecha | Date |
| Hora | Single line text |
| Personas | Number |
| Duración | Number |
| Extras | Long text |
| TipoEvento | Single select |
| MétodoPago | Single select |
| PrecioTotal | Currency |
| Estado | Single select |
| EventoCalendarioID | Single line text |
| FechaCreación | Date |

4. Obtener **Personal Access Token**:
   - Clic en tu perfil → Developer hub
   - Create new token
   - Dar permisos: `data.records:read` y `data.records:write`
   - Copiar token

5. En n8n:
   - Settings → Credentials → Add → **Airtable Personal Access Token**
   - Pegar token
   - Guardar como: **"Airtable HappyHub"**

6. Actualizar IDs en el flujo:
   - Abrir flujo → Doble clic en **"Guardar en Airtable"**
   - Actualizar **baseId** (empieza con `app...`)
   - Actualizar **tableId** (empieza con `tbl...`)
   - Los IDs están en la URL de tu base de Airtable

---

### 4. Configurar Stripe (2 min)

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com)
2. Activar **modo test** (toggle arriba a la derecha)
3. Ir a **Developers** → **API keys**
4. Copiar **Secret key** (empieza con `sk_test_...`)
5. En n8n:
   - Settings → Credentials → Add → **Stripe API**
   - Pegar Secret Key
   - Guardar como: **"Stripe HappyHub"**

---

### 5. Configurar Claude AI (1 min)

1. Ir a [Anthropic Console](https://console.anthropic.com)
2. Crear API Key
3. En n8n:
   - Settings → Credentials → Add → **Anthropic API**
   - Pegar API Key
   - Guardar como: **"Anthropic API"**

---

### 6. Configurar SMTP - Gmail (2 min)

1. Ir a tu cuenta de Google
2. Activar verificación en 2 pasos
3. Generar App Password:
   - [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Seleccionar: **Mail** + **Other (Custom name)**
   - Nombre: "n8n HappyHub"
   - Copiar password generado

4. En n8n:
   - Settings → Credentials → Add → **SMTP**
   - Configurar:
     - Host: `smtp.gmail.com`
     - Port: `587`
     - User: `tu-email@gmail.com`
     - Password: El App Password generado
     - Secure: **TLS**
   - Guardar como: **"SMTP HappyHub"**

---

### 7. Asignar Credenciales a los Nodos

Abrir el flujo y verificar que cada nodo tenga sus credenciales asignadas:

1. **"Verificar Disponibilidad en Calendar"** → Google Calendar HappyHub
2. **"Crear Evento en Calendario"** → Google Calendar HappyHub
3. **"Guardar en Airtable"** → Airtable HappyHub
4. **"Crear Link de Pago Stripe"** → Stripe HappyHub
5. **"Generar Mensaje con Claude AI"** → Anthropic API
6. **"Enviar Email de Confirmación"** → SMTP HappyHub

---

### 8. Activar el Flujo

1. Clic en el botón **"Active"** (esquina superior derecha)
2. El toggle debe ponerse en verde
3. Copiar la URL del webhook (aparece en el nodo "Webhook Reserva")

---

### 9. Configurar Next.js (30 seg)

Actualizar `.env` en tu proyecto:

```env
N8N_WEBHOOK_URL=https://n8n-n8n.ljmvxa.easypanel.host/webhook/reserva-happyhub
```

---

### 10. Probar el Sistema (30 seg)

Usar el script de prueba:

```bash
cd n8n
./test-webhook.sh
# Seleccionar opción 1
```

O usar curl directamente:

```bash
curl -X POST https://n8n-n8n.ljmvxa.easypanel.host/webhook/reserva-happyhub \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "tu-email@gmail.com",
    "phone": "+34600000000",
    "eventType": "Cumpleaños",
    "date": "2025-01-30",
    "time": "18:00",
    "guests": 20,
    "duration": "4",
    "totalPrice": 450
  }'
```

**Deberías recibir:**
- ✅ Respuesta JSON con `success: true`
- ✅ Evento creado en Google Calendar
- ✅ Registro en Airtable
- ✅ Email de confirmación en tu bandeja

---

## 🎉 ¡Listo!

Tu sistema de reservas está funcionando. Ahora puedes:

1. Ver ejecuciones en n8n: **Executions** (menú lateral)
2. Ver eventos en Google Calendar
3. Ver reservas en Airtable
4. Probar pagos en Stripe (modo test)

---

## 🔧 Próximos Pasos

### Personalización Básica

1. **Cambiar dominio de producción:**
   - Editar nodo "Crear Link de Pago Stripe"
   - Actualizar URL de redirección
   - Ver: `CONFIGURACION_URL.md`

2. **Personalizar email:**
   - Editar nodo "Enviar Email de Confirmación"
   - Cambiar remitente (`fromEmail`)
   - Personalizar HTML del mensaje

3. **Ajustar campos de Airtable:**
   - Agregar campos personalizados en Airtable
   - Actualizar nodo "Guardar en Airtable"
   - Mapear nuevos campos

### Testing Avanzado

```bash
# Probar todos los escenarios
./test-webhook.sh
# Seleccionar opción 5
```

---

## 📚 Documentación Completa

Para más información, consulta:

- **INSTRUCCIONES_CONFIGURACION.md** - Guía detallada completa
- **README.md** - Documentación general del sistema
- **CONFIGURACION_URL.md** - Configuración de URLs sin variables de entorno
- **test-examples.json** - Ejemplos de payloads para testing

---

## 🆘 Problemas Comunes

### "Error: credential not found"
**Solución:** Asignar las credenciales correctas a cada nodo

### "Error: Invalid signature" (Stripe)
**Solución:** Verificar que el Secret Key sea del mismo entorno (test/live)

### Email no llega
**Solución:**
1. Verificar App Password de Gmail
2. Revisar carpeta de spam
3. Verificar que el puerto sea 587 y TLS esté activado

### "Lo siento, la fecha y hora indicada ya está reservada"
**Solución:** Esto es correcto, el sistema detectó un conflicto. Usar otra fecha/hora.

---

## 🎯 Checklist Final

Antes de ir a producción:

- [ ] Todas las credenciales configuradas y probadas
- [ ] Test exitoso con script o curl
- [ ] Email de confirmación recibido
- [ ] Evento visible en Google Calendar
- [ ] Registro visible en Airtable
- [ ] Payment link de Stripe funciona
- [ ] Dominio de producción configurado
- [ ] SSL/HTTPS configurado
- [ ] Variables de entorno en Next.js actualizadas

---

**¿Todo funcionando?** 🚀

Ahora puedes integrar el sistema con tu frontend de Next.js. El endpoint `/api/webhook-reserva` está listo para recibir las reservas.

**¿Tienes problemas?**

Revisa la sección de **Troubleshooting** en `INSTRUCCIONES_CONFIGURACION.md` o las ejecuciones fallidas en n8n para ver logs detallados.
