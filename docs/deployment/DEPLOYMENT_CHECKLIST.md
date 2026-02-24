# ✅ Checklist de Deployment Completo - HappyHub

## 🎯 Estado Actual

✅ **Frontend** - Código actualizado y subido a GitHub
✅ **Workflows n8n** - Listos para importar
✅ **Airtable** - Base configurada con campos correctos

---

## 📋 Pasos para Completar el Deployment End-to-End

### 1️⃣ n8n - Importar y Configurar Workflows

#### A. Configurar Credenciales

1. Abre n8n: https://n8n-n8n.ljmvxa.easypanel.host
2. Ve a **Settings** → **Credentials**
3. Crea 3 credenciales:

**Airtable HappyHub:**
- Type: Airtable Personal Access Token API
- Token: [ver archivo local `airtable-credentials.json`]

**Google Calendar happyhub.rovellat:**
- Type: Google Calendar OAuth2 API
- Autorizar con: happyhub.rovellat@gmail.com

**SMTP HappyHub:**
- Type: SMTP
- Host: smtp.gmail.com
- Port: 587
- User: happyhub.rovellat@gmail.com
- Password: [Contraseña de aplicación de Google]
- From: happyhub.rovellat@gmail.com

> Para crear contraseña de aplicación: https://myaccount.google.com/apppasswords

#### B. Importar Workflows

**Workflow 1: Nueva Solicitud**
1. Add workflow → Import from File
2. Archivo: `n8n/workflows/happyhub-airtable-complete.json`
3. Asignar credenciales a cada nodo
4. **Guardar** y **Activar** ✅
5. **IMPORTANTE:** Copiar la **Production URL** del webhook
   - Ejemplo: `https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request`

**Workflow 2: Automatización Aprobaciones**
1. Add workflow → Import from File
2. Archivo: `n8n/workflows/happyhub-airtable-automation-v2.json`
3. Asignar credenciales a cada nodo
4. **Guardar** y **Activar** ✅

**Estado:**
- [ ] Credenciales configuradas
- [ ] Workflow 1 importado y activo
- [ ] Workflow 2 importado y activo
- [ ] Webhook URL copiada

---

### 2️⃣ Vercel - Configurar Variables de Entorno

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Click en tu proyecto **happyhub**
3. **Settings** → **Environment Variables**
4. Añade esta variable (CRÍTICA):

```
Key: NEXT_PUBLIC_N8N_WEBHOOK_URL
Value: https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request
Environments: Production, Preview, Development
```

> **MUY IMPORTANTE:** Usa la URL exacta que copiaste del webhook en n8n (paso 1.B)

**Estado:**
- [ ] Variable `NEXT_PUBLIC_N8N_WEBHOOK_URL` añadida

---

### 3️⃣ Vercel - Redeploy

1. En Vercel, ve a **Deployments**
2. Click en **Redeploy** (botón arriba)
3. O simplemente haz un nuevo commit (auto-deploy):
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

**Estado:**
- [ ] Aplicación redeployada
- [ ] Deployment exitoso (sin errores)

---

### 4️⃣ Probar el Flujo Completo End-to-End

#### Test 1: Nueva Solicitud desde Producción

1. Abre tu sitio en producción: **https://tu-dominio.vercel.app/reservas**
2. Completa el formulario con datos reales:
   ```
   Nombre: Test Usuario
   Email: tu_email@gmail.com (tu email real)
   Teléfono: 624645517
   Tipo de evento: Cumpleaños
   Fecha: [Una fecha futura, ej: 20 de enero de 2025]
   Franja: Tarde (16:30-20:30)
   Invitados: 50
   Método de pago: Tarjeta
   ```
3. Click **"Solicitar Reserva"**

**✅ Verificaciones:**
- [ ] Frontend muestra: "¡Solicitud Enviada!"
- [ ] Mensaje incluye número de solicitud
- [ ] NO hay errores en la consola del navegador (F12)

**En n8n:**
- [ ] Ve a **Executions** → Hay una ejecución nueva
- [ ] Ejecución está en **verde** (exitosa)
- [ ] Todos los nodos ejecutados correctamente

**En Airtable:**
- [ ] Nuevo registro aparece en la tabla
- [ ] Status = "Pending"
- [ ] Todos los campos llenos correctamente

**En tu email:**
- [ ] Recibes email en happyhub.rovellat@gmail.com (Admin)
- [ ] Subject: "🔔 Nueva Solicitud #XXX - Requiere Aprobación"
- [ ] Contiene link a Airtable

**En email del cliente:**
- [ ] El cliente recibe email de confirmación
- [ ] Subject: "✅ Solicitud Recibida - HappyHub #XXX"
- [ ] Contiene resumen de la reserva

---

#### Test 2: Aprobar Reserva Manualmente

1. Abre Airtable: https://airtable.com/appAj3N7bMGIVBagd/tblGakVr6paaokq9N
2. Encuentra el registro de prueba
3. Cambia **Status** de `Pending` a `Approved`
4. Espera 1-2 minutos

**✅ Verificaciones:**

**En n8n:**
- [ ] Nueva ejecución del Workflow 2
- [ ] Ejecución exitosa (verde)

**En Google Calendar:**
- [ ] Abre: https://calendar.google.com (con happyhub.rovellat@gmail.com)
- [ ] Evento creado en la fecha y hora correcta
- [ ] Título: "Reserva HappyHub - Test Usuario"

**En Airtable:**
- [ ] Campo "Google Calendar ID" se llenó automáticamente
- [ ] Campo "Reviewed At" tiene fecha/hora

**En email del cliente:**
- [ ] Cliente recibe nuevo email
- [ ] Subject: "🎉 ¡Reserva Aprobada! - HappyHub"
- [ ] Contiene detalles del evento y próximos pasos

---

#### Test 3: Slot Ocupado (Validación)

1. En Google Calendar (happyhub.rovellat@gmail.com), crea un evento manual:
   ```
   Título: Evento de prueba bloqueado
   Fecha: [Elige una fecha futura]
   Hora: 16:30 - 20:30
   ```
2. Intenta reservar esa MISMA fecha y franja desde el sitio web

**✅ Verificaciones:**
- [ ] Frontend muestra error en rojo
- [ ] Mensaje: "Lo siento, la fecha ya está reservada..."
- [ ] NO se crea registro en Airtable
- [ ] NO se envían emails

---

## 🎉 Si Todos los Tests Pasan

¡Felicidades! Tu sistema de reservas está **100% funcional** end-to-end:

✅ Frontend → n8n → Airtable → Google Calendar → Emails

---

## 🐛 Troubleshooting

### Error: "N8N_WEBHOOK_URL no está configurada"

**Causa:** Variable de entorno no configurada o mal escrita

**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que sea exactamente: `NEXT_PUBLIC_N8N_WEBHOOK_URL`
3. Redeploy

---

### Error: "Network Error" o "ERR_NETWORK"

**Causa:** La URL de n8n no es accesible desde el navegador

**Solución:**
1. Verifica que la URL sea accesible públicamente
2. Abre la URL en tu navegador: `https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request`
3. Si ves un error 404 o 405, está bien (significa que es accesible)
4. Si no carga o timeout → problema de red/DNS

---

### Error: CORS blocked

**Causa:** n8n bloqueando requests desde el navegador

**Solución:**
1. En n8n, ve al workflow
2. Click en el nodo "Webhook - Nueva Solicitud"
3. Verifica que **Authentication** = "None"
4. Guardar workflow

---

### Emails no se envían

**Causa:** Credencial SMTP mal configurada

**Solución:**
1. En n8n → Settings → Credentials → SMTP HappyHub
2. Click **Edit**
3. Click **Test Connection**
4. Si falla:
   - Verifica que uses **Contraseña de aplicación** (16 caracteres)
   - No la contraseña normal de Gmail
   - Regenera la contraseña: https://myaccount.google.com/apppasswords

---

### Workflow no se ejecuta (Workflow 2)

**Causa:** Workflow no está activo o filtro incorrecto

**Solución:**
1. Verifica que el workflow esté **ACTIVO** (toggle verde)
2. En Airtable, verifica:
   - Status = `Approved` (con A mayúscula)
   - Google Calendar ID = vacío (sin valor)
3. Espera 1-2 minutos (polling cada minuto)

---

## 📊 Flujo Completo Visualizado

```
                 🌐 Usuario en Web
                        ↓
                 Completa formulario
                        ↓
        📤 POST → n8n webhook (Workflow 1)
                        ↓
        🔍 Verifica disponibilidad en Google Calendar
                        ↓
                    ¿Libre?
                   /        \
                 SÍ          NO
                 ↓            ↓
        💾 Crea en Airtable   ❌ Error 409
        (Status: Pending)      "Slot ocupado"
                 ↓
        📧 Emails: Admin + Cliente
                 ↓
        ✅ Respuesta exitosa al frontend

                 ⏱️ [Espera manual]

        👨‍💼 Admin abre Airtable
                 ↓
        Cambia Status → Approved
                 ↓
        ⏰ Workflow 2 detecta (polling cada 1 min)
                 ↓
        📅 Crea evento en Google Calendar
                 ↓
        💾 Actualiza Airtable con Calendar ID
                 ↓
        📧 Email al cliente: "¡Reserva Aprobada!"
```

---

## 🔗 Links Útiles

- **Tu sitio en producción:** https://tu-dominio.vercel.app
- **n8n:** https://n8n-n8n.ljmvxa.easypanel.host
- **Airtable:** https://airtable.com/appAj3N7bMGIVBagd/tblGakVr6paaokq9N
- **Google Calendar:** https://calendar.google.com (happyhub.rovellat@gmail.com)
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/edugarciac/happyhub

---

## 📚 Documentación de Referencia

- `IMPORTAR_N8N_AHORA.md` - Guía detallada de importación de workflows
- `VERCEL_ENV_SETUP.md` - Configuración de variables de entorno
- `AIRTABLE_CAMPO_UPDATES.md` - Referencia de campos de Airtable
- `N8N_IMPORT_GUIDE.md` - Guía alternativa de importación

---

**Última actualización:** 26 de diciembre de 2024

¡Mucha suerte con el deployment! 🚀
