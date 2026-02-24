# 🚀 Importar Workflows a n8n - AHORA

## ✅ Estado Actual

- ✅ URL de n8n actualizada: https://n8n-n8n.ljmvxa.easypanel.host
- ✅ Base de Airtable configurada con todos los campos correctos
- ✅ Workflows actualizados y listos para importar

---

## 📝 Paso 1: Configurar Credenciales en n8n

Antes de importar los workflows, necesitas configurar 3 credenciales en n8n.

### 🔐 1.1 - Airtable Personal Access Token

1. Abre tu n8n: https://n8n-n8n.ljmvxa.easypanel.host
2. Ve a **Settings** (icono de engranaje) → **Credentials**
3. Click en **Add Credential** (botón azul arriba a la derecha)
4. Busca: **"Airtable Personal Access Token API"**
5. Configura:
   ```
   Credential name: Airtable HappyHub
   Personal Access Token: [VER ARCHIVO LOCAL airtable-credentials.json]
   ```
   > **Nota:** El token está en: `/Users/e.garcia.casas/OneDrive - Allianz/Code/happyhub/airtable-credentials.json`
6. Click **Save**

### 📅 1.2 - Google Calendar OAuth2

1. En **Settings** → **Credentials**
2. Click **Add Credential**
3. Busca: **"Google Calendar OAuth2 API"**
4. Configura:
   ```
   Credential name: Google Calendar happyhub.rovellat
   ```
5. Click en **Sign in with Google**
6. Autoriza con la cuenta: **happyhub.rovellat@gmail.com**
7. Acepta los permisos solicitados
8. Click **Save**

### 📧 1.3 - SMTP para Emails

#### Si usas Gmail:

1. Primero crea una **Contraseña de aplicación** en Google:
   - Ve a: https://myaccount.google.com/apppasswords
   - Inicia sesión con: happyhub.rovellat@gmail.com
   - Selecciona: **Correo** y **Otro** (nombre: n8n)
   - Copia la contraseña generada (16 caracteres)

2. En n8n, **Settings** → **Credentials**
3. Click **Add Credential**
4. Busca: **"SMTP"**
5. Configura:
   ```
   Credential name: SMTP HappyHub
   Host: smtp.gmail.com
   Port: 587
   SSL/TLS: Enable
   User: happyhub.rovellat@gmail.com
   Password: [Pega la contraseña de aplicación de 16 caracteres]
   From Email: happyhub.rovellat@gmail.com
   ```
6. Click **Test Connection** para verificar
7. Click **Save**

---

## 📥 Paso 2: Importar Workflow 1 - Nueva Solicitud

1. En n8n, ve a la página principal (icono de casa)
2. Click en **Add workflow** (botón con + arriba a la derecha)
3. Se abre un workflow vacío
4. Click en el menú **☰** (arriba a la izquierda)
5. Selecciona **Import from File...**
6. Navega a: `/Users/e.garcia.casas/OneDrive - Allianz/Code/happyhub/n8n/workflows/`
7. Selecciona: **`happyhub-airtable-complete.json`**
8. Click **Open**

### Verificar Credenciales:

El workflow se importará con todos los nodos. Verifica que cada nodo tenga las credenciales asignadas:

- **Nodo "Google Calendar - Verificar Disponibilidad":**
  - Click en el nodo
  - En **Credential to connect with**, selecciona: `Google Calendar happyhub.rovellat`

- **Nodo "Airtable - Crear Registro":**
  - Click en el nodo
  - En **Credential to connect with**, selecciona: `Airtable HappyHub`

- **Nodo "Email - Notificar Admin":**
  - Click en el nodo
  - En **Credential to connect with**, selecciona: `SMTP HappyHub`

- **Nodo "Email - Confirmar Cliente":**
  - Click en el nodo
  - En **Credential to connect with**, selecciona: `SMTP HappyHub`

### Guardar y Activar:

1. Click **Save** (botón arriba a la derecha)
2. Pon un nombre: **"HappyHub - Nueva Solicitud"**
3. Click **Active** (toggle arriba a la derecha) para activar el workflow

### Copiar Webhook URL:

1. Click en el primer nodo: **"Webhook - Nueva Solicitud"**
2. Verás la **Production URL** en el panel derecho
3. Copia esta URL (algo como: `https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request`)
4. Guárdala en tu `.env`:
   ```bash
   N8N_WEBHOOK_URL=https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request
   ```

---

## 📥 Paso 3: Importar Workflow 2 - Automatización

1. En n8n, ve a la página principal
2. Click en **Add workflow** (botón con +)
3. Click en el menú **☰**
4. Selecciona **Import from File...**
5. Selecciona: **`happyhub-airtable-automation.json`**
6. Click **Open**

### Verificar Credenciales:

- **Nodo "Airtable - Detectar Aprobadas":**
  - Selecciona: `Airtable HappyHub`

- **Nodo "Google Calendar - Crear Evento":**
  - Selecciona: `Google Calendar happyhub.rovellat`

- **Nodo "Airtable - Actualizar con Calendar ID":**
  - Selecciona: `Airtable HappyHub`

- **Nodo "Email - Notificar Cliente Aprobación":**
  - Selecciona: `SMTP HappyHub`

### Guardar y Activar:

1. Click **Save**
2. Nombre: **"HappyHub - Automatización Aprobaciones"**
3. Click **Active** para activar

> **Nota:** Este workflow se ejecuta automáticamente cada 1 minuto buscando reservas con Status='Approved'.

---

## ✅ Paso 4: Verificar Configuración

### Checklist de credenciales:

- [ ] ✅ Airtable HappyHub configurada
- [ ] ✅ Google Calendar happyhub.rovellat configurada
- [ ] ✅ SMTP HappyHub configurada y probada

### Checklist de workflows:

- [ ] ✅ Workflow 1 importado: "HappyHub - Nueva Solicitud"
- [ ] ✅ Workflow 1 **ACTIVO** (toggle verde)
- [ ] ✅ Workflow 1: Todos los nodos con credenciales asignadas (sin ⚠️)
- [ ] ✅ Webhook URL copiada y guardada en .env
- [ ] ✅ Workflow 2 importado: "HappyHub - Automatización Aprobaciones"
- [ ] ✅ Workflow 2 **ACTIVO** (toggle verde)
- [ ] ✅ Workflow 2: Todos los nodos con credenciales asignadas (sin ⚠️)

---

## 🧪 Paso 5: Probar el Sistema

### Test 1: Nueva Solicitud desde Web

1. Abre tu aplicación: http://localhost:3000/reservas
2. Completa el formulario:
   ```
   Nombre: Test Usuario
   Email: tu_email@gmail.com
   Teléfono: 624645517
   Tipo de evento: Cumpleaños
   Fecha: [Una fecha futura, ej: 15 de enero de 2025]
   Franja: Tarde (16:30-20:30)
   Invitados: 50
   Método de pago: Tarjeta
   ```
3. Click **"Solicitar Reserva"**

**✅ Resultado esperado:**
- Frontend muestra: "¡Solicitud Enviada!"
- En n8n → **Executions**, verás una ejecución exitosa (verde)
- En Airtable, aparece nuevo registro con Status="Pending"
- Recibes email en happyhub.rovellat@gmail.com (notificación admin)
- El cliente recibe email de confirmación

**❌ Si falla:**
- Ve a n8n → **Executions** → Click en la ejecución fallida
- Ve el error en el nodo que falló (rojo)
- Verifica que la credencial esté bien configurada

### Test 2: Aprobar Reserva Manualmente

1. Abre Airtable: https://airtable.com/appAj3N7bMGIVBagd/tblGakVr6paaokq9N
2. Encuentra el registro de prueba
3. Cambia el campo **Status** de `Pending` a `Approved`
4. Espera 1-2 minutos (el workflow 2 se ejecuta cada minuto)

**✅ Resultado esperado:**
- En n8n → **Executions**, verás ejecución del workflow 2 (verde)
- En Google Calendar (happyhub.rovellat@gmail.com), aparece evento creado
- En Airtable, el campo "Google Calendar ID" se rellena automáticamente
- El cliente recibe email: "🎉 ¡Reserva Aprobada!"

### Test 3: Slot Ocupado

1. En Google Calendar (happyhub.rovellat@gmail.com), crea un evento manual:
   ```
   Título: Evento de prueba
   Fecha: [La misma que vas a probar]
   Hora: 16:30 - 20:30
   ```
2. Intenta reservar esa misma fecha y franja desde la web

**✅ Resultado esperado:**
- Frontend muestra error: "Lo siento, la fecha ya está reservada"
- NO se crea registro en Airtable
- NO se envían emails

---

## 🐛 Solución de Problemas

### Error: "Credential not found"

**Solución:**
- Verifica que los nombres de las credenciales coincidan EXACTAMENTE:
  - `Airtable HappyHub`
  - `Google Calendar happyhub.rovellat`
  - `SMTP HappyHub`
- Si usaste otros nombres, edita cada nodo y selecciona la credencial correcta

### Error: "Failed to connect to Airtable"

**Solución:**
1. Ve a **Settings** → **Credentials** → `Airtable HappyHub`
2. Click **Edit**
3. Verifica que el token sea correcto
4. Click **Test**
5. Si falla, regenera el token en Airtable:
   - https://airtable.com/create/tokens
   - Permisos: `data.records:read` y `data.records:write`

### Error: "Google Calendar: 401 Unauthorized"

**Solución:**
1. Ve a **Settings** → **Credentials** → `Google Calendar happyhub.rovellat`
2. Click **Reconnect**
3. Vuelve a autorizar con happyhub.rovellat@gmail.com

### Error: "SMTP: Connection refused"

**Solución para Gmail:**
1. Verifica que uses la **Contraseña de aplicación** (16 caracteres), NO la contraseña normal
2. Verifica configuración:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - SSL/TLS: ✅ Activado
3. Verifica que la cuenta no tenga verificación en 2 pasos sin contraseña de aplicación

### Workflow no se ejecuta (Workflow 2)

**Solución:**
1. Verifica que el workflow esté **ACTIVO** (toggle verde)
2. En Airtable, verifica que el registro tenga:
   - Status = `Approved` (con A mayúscula)
   - Google Calendar ID = vacío
3. Ve a n8n → **Executions** para ver si hay errores

---

## 📊 Monitorear Ejecuciones

### Ver historial en n8n:

1. Click en **Executions** (en el menú lateral izquierdo)
2. Verás todas las ejecuciones:
   - 🟢 **Verde** = Exitosa
   - 🔴 **Rojo** = Error
   - 🟡 **Amarillo** = En progreso

### Ver detalles de una ejecución:

1. Click en cualquier ejecución
2. Verás el flujo completo con los datos que pasaron por cada nodo
3. Si hay error, el nodo problemático aparece en rojo con el mensaje de error

---

## 🎯 Flujo Completo del Sistema

```
1. 👤 Cliente completa formulario en web
         ↓
2. 📤 Frontend envía POST a webhook n8n
         ↓
3. 🔍 n8n verifica disponibilidad en Google Calendar
         ↓
4. ✅ Si está libre → Crea registro en Airtable (Status: Pending)
         ↓
5. 📧 Envía emails: Admin (notificación) + Cliente (confirmación)
         ↓
6. 👨‍💼 Admin abre Airtable y cambia Status a "Approved"
         ↓
7. ⏱️ Workflow 2 detecta aprobación (polling cada 1 min)
         ↓
8. 📅 Crea evento en Google Calendar
         ↓
9. 💾 Actualiza Airtable con Calendar Event ID
         ↓
10. 📧 Envía email al cliente: "¡Reserva Aprobada!"
```

---

## 🎉 ¡Listo!

Una vez que completes todos los pasos y las pruebas funcionen, tu sistema de reservas estará completamente operativo.

**Próximos pasos opcionales:**
- Crear página de admin en la web para aprobar desde ahí (en lugar de Airtable)
- Integrar Stripe para pagos automáticos
- Añadir recordatorios automáticos antes del evento
- Crear panel de estadísticas

---

**Última actualización:** 26 de diciembre de 2024

**Archivos importantes:**
- Workflows: `/Users/e.garcia.casas/OneDrive - Allianz/Code/happyhub/n8n/workflows/`
- Credenciales locales: `/Users/e.garcia.casas/OneDrive - Allianz/Code/happyhub/airtable-credentials.json`
- Guía de campos: `/Users/e.garcia.casas/OneDrive - Allianz/Code/happyhub/AIRTABLE_CAMPO_UPDATES.md`
