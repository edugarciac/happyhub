# 📥 Guía de Importación de Workflows n8n

## 🎯 Objetivo

Importar y configurar los 2 workflows de HappyHub en tu instancia de n8n para gestionar todo el flujo de reservas con Airtable.

**URL de tu n8n:** https://n8n-n8n.ljmvxa.easypanel.host

---

## 📋 Requisitos Previos

Antes de importar, necesitas configurar las credenciales en n8n:

### 1️⃣ Airtable Personal Access Token

1. En n8n, ve a: **Settings** → **Credentials** → **New Credential**
2. Busca y selecciona: **Airtable Personal Access Token API**
3. Configura:
   - **Credential name:** `Airtable HappyHub`
   - **Personal Access Token:** `[TU_AIRTABLE_TOKEN]` (ver archivo local `airtable-credentials.json`)
4. Click **Save**

### 2️⃣ Google Calendar OAuth2

1. En n8n, ve a: **Settings** → **Credentials** → **New Credential**
2. Busca y selecciona: **Google Calendar OAuth2 API**
3. Configura:
   - **Credential name:** `Google Calendar happyhub.rovellat`
   - Sigue el flujo de OAuth2 para autorizar la cuenta: **hola@happyhub.es**
   - Permisos necesarios: Leer y escribir eventos del calendario
4. Click **Save**

### 3️⃣ SMTP para Email

1. En n8n, ve a: **Settings** → **Credentials** → **New Credential**
2. Busca y selecciona: **SMTP**
3. Configura:
   - **Credential name:** `SMTP HappyHub`
   - **Host:** (depende de tu proveedor, ej: `smtp.gmail.com`)
   - **Port:** `587` (TLS) o `465` (SSL)
   - **User:** `hola@happyhub.es` (o tu email)
   - **Password:** (contraseña de aplicación si usas Gmail)
   - **From Email:** `noreply@happyhub.es`
4. Click **Save**

> **Nota:** Si usas Gmail, necesitas crear una "Contraseña de aplicación" en: https://myaccount.google.com/apppasswords

---

## 🔄 Importar Workflows

### Workflow 1: Nueva Solicitud de Reserva

**Archivo:** `n8n/workflows/happyhub-airtable-complete.json`

**Función:**
- Recibe solicitudes desde el formulario web
- Valida disponibilidad en Google Calendar
- Crea registro en Airtable (status: pending)
- Envía emails de confirmación

**Pasos:**

1. En n8n, ve a: **Workflows** → **Add workflow** (botón con +)
2. Click en el menú de opciones (3 puntos) → **Import from File**
3. Selecciona el archivo: `n8n/workflows/happyhub-airtable-complete.json`
4. El workflow se importará con todos los nodos configurados
5. Verifica las credenciales:
   - Nodo **"Google Calendar - Verificar Disponibilidad"**: Debe usar `Google Calendar happyhub.rovellat`
   - Nodo **"Airtable - Crear Registro"**: Debe usar `Airtable HappyHub`
   - Nodos **"Email - Notificar Admin"** y **"Email - Confirmar Cliente"**: Deben usar `SMTP HappyHub`
6. Click **Save** (guardar workflow)
7. Click **Active** (activar workflow)
8. Copia la **URL del Webhook**:
   - Aparecerá en el nodo "Webhook - Nueva Solicitud"
   - Formato: `https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request`

### Workflow 2: Automatización de Aprobaciones

**Archivo:** `n8n/workflows/happyhub-airtable-automation.json`

**Función:**
- Detecta reservas aprobadas en Airtable (status='approved')
- Crea evento en Google Calendar
- Actualiza Airtable con el Calendar Event ID
- Envía email al cliente notificando la aprobación

**Pasos:**

1. En n8n, ve a: **Workflows** → **Add workflow** (botón con +)
2. Click en el menú de opciones (3 puntos) → **Import from File**
3. Selecciona el archivo: `n8n/workflows/happyhub-airtable-automation.json`
4. El workflow se importará con todos los nodos configurados
5. Verifica las credenciales:
   - Nodo **"Airtable - Detectar Aprobadas"**: Debe usar `Airtable HappyHub`
   - Nodo **"Google Calendar - Crear Evento"**: Debe usar `Google Calendar happyhub.rovellat`
   - Nodo **"Airtable - Actualizar con Calendar ID"**: Debe usar `Airtable HappyHub`
   - Nodo **"Email - Notificar Cliente Aprobación"**: Debe usar `SMTP HappyHub`
6. Click **Save** (guardar workflow)
7. Click **Active** (activar workflow)

> **Importante:** Este workflow se ejecuta automáticamente cada 1 minuto para buscar nuevas aprobaciones.

---

## 🔗 Conectar Frontend con n8n

Una vez importados los workflows, necesitas actualizar tu aplicación web:

### Actualizar variables de entorno (.env)

```bash
# URL del webhook del Workflow 1
N8N_WEBHOOK_URL=https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request
```

### Actualizar código del frontend (si es necesario)

En `src/lib/apiClient.ts` o donde hagas las llamadas, asegúrate de que la URL del webhook sea la correcta:

```typescript
const response = await axios.post(process.env.N8N_WEBHOOK_URL, reservationData);
```

---

## ✅ Verificar Configuración

### Checklist de credenciales en n8n:

- [ ] ✅ Airtable Personal Access Token (`Airtable HappyHub`)
- [ ] ✅ Google Calendar OAuth2 (`Google Calendar happyhub.rovellat`)
- [ ] ✅ SMTP (`SMTP HappyHub`)

### Checklist de workflows:

- [ ] ✅ Workflow 1 importado y **ACTIVO**
- [ ] ✅ Workflow 2 importado y **ACTIVO**
- [ ] ✅ Todos los nodos tienen credenciales asignadas (sin iconos de advertencia)
- [ ] ✅ URL del webhook copiada y guardada en `.env`

---

## 🧪 Probar el Sistema

### Prueba 1: Nueva Solicitud

1. Abre tu aplicación web: http://localhost:3000
2. Ve a la página de reservas
3. Completa el formulario con datos de prueba
4. Click en "Solicitar Reserva"
5. **Verificar:**
   - ✅ Frontend muestra mensaje "¡Solicitud Enviada!"
   - ✅ En n8n, el workflow 1 se ejecuta correctamente (ver Executions)
   - ✅ En Airtable, aparece nuevo registro con status="pending"
   - ✅ Recibes email en hola@happyhub.es (notificación admin)
   - ✅ El cliente recibe email de confirmación

### Prueba 2: Aprobación Manual

1. Abre tu base de Airtable: https://airtable.com/appAj3N7bMGIVBagd/tblGakVr6paaokq9N
2. Localiza el registro de prueba
3. Cambia el campo **Status** de `pending` a `approved`
4. Espera 1-2 minutos (el workflow 2 se ejecuta cada minuto)
5. **Verificar:**
   - ✅ En n8n, el workflow 2 se ejecuta correctamente
   - ✅ En Google Calendar (hola@happyhub.es), aparece el evento creado
   - ✅ En Airtable, el campo "Google Calendar ID" se actualiza
   - ✅ El cliente recibe email de "¡Reserva Aprobada!"

### Prueba 3: Slot Ocupado

1. Crea un evento manualmente en Google Calendar (hola@happyhub.es)
2. Intenta reservar la misma fecha y franja desde el formulario web
3. **Verificar:**
   - ✅ Frontend muestra error: "Lo siento, la fecha ya está reservada"
   - ✅ NO se crea registro en Airtable
   - ✅ NO se envía email

---

## 🐛 Solución de Problemas

### Error: "Credential not found"

**Solución:** Verifica que el nombre de la credencial en n8n coincida exactamente:
- `Airtable HappyHub`
- `Google Calendar happyhub.rovellat`
- `SMTP HappyHub`

Si los nombres son diferentes, edita los nodos del workflow para seleccionar las credenciales correctas.

### Error: "Failed to connect to Airtable"

**Solución:**
1. Verifica que el Personal Access Token sea correcto
2. Verifica que los Base ID y Table ID estén actualizados en los workflows:
   - Base ID: `appAj3N7bMGIVBagd`
   - Table ID: `tblGakVr6paaokq9N`

### Error: "Google Calendar: 401 Unauthorized"

**Solución:**
1. Ve a las credenciales de Google Calendar en n8n
2. Click en "Reconnect" o "Reauthorize"
3. Vuelve a autorizar con la cuenta hola@happyhub.es

### Error: "SMTP: Authentication failed"

**Solución:**
- Si usas Gmail, asegúrate de usar una "Contraseña de aplicación" en lugar de la contraseña normal
- Verifica que el puerto sea correcto (587 para TLS, 465 para SSL)
- Verifica que el host SMTP sea correcto

### Workflow no se ejecuta automáticamente (Workflow 2)

**Solución:**
1. Verifica que el workflow esté **ACTIVO** (toggle verde)
2. Verifica que haya al menos un registro en Airtable con:
   - Status = 'approved'
   - Google Calendar ID = vacío (sin valor)
3. Revisa el historial de ejecuciones en n8n (Executions)

---

## 📊 Monitoreo

### Ver ejecuciones en n8n

1. En n8n, ve a: **Executions** (en el menú lateral)
2. Aquí verás todas las ejecuciones de tus workflows
3. Click en cualquier ejecución para ver los detalles y datos que pasaron por cada nodo
4. Si hay errores, aparecerán en rojo con el mensaje de error

### Logs útiles

- **Success ejecutions (verde):** Todo funcionó correctamente
- **Error ejecutions (rojo):** Hubo un fallo, revisar el mensaje de error
- **Waiting ejecutions (amarillo):** El workflow está esperando algo (ej: respuesta de webhook)

---

## 🎯 Flujo Completo

```
1. Cliente completa formulario web
         ↓
2. Frontend envía datos a Webhook n8n (Workflow 1)
         ↓
3. n8n valida disponibilidad en Google Calendar
         ↓
4. Si libre → Crea registro en Airtable (status: pending)
         ↓
5. Envía emails: Admin (notificación) + Cliente (confirmación)
         ↓
6. Admin abre Airtable y cambia status a "approved"
         ↓
7. Workflow 2 detecta la aprobación (polling cada 1 min)
         ↓
8. Crea evento en Google Calendar
         ↓
9. Actualiza Airtable con Calendar Event ID
         ↓
10. Envía email al cliente: "¡Reserva Aprobada!"
```

---

## 📚 Recursos

- **n8n Docs:** https://docs.n8n.io
- **Airtable API:** https://airtable.com/developers/web/api/introduction
- **Google Calendar API:** https://developers.google.com/calendar/api

---

## ✅ Checklist Final

Antes de dar por terminada la configuración:

- [ ] ✅ Ambos workflows importados y activos
- [ ] ✅ Todas las credenciales configuradas correctamente
- [ ] ✅ Base ID y Table ID actualizados en los workflows
- [ ] ✅ Webhook URL actualizada en .env del frontend
- [ ] ✅ Prueba 1 completada (nueva solicitud)
- [ ] ✅ Prueba 2 completada (aprobación manual)
- [ ] ✅ Prueba 3 completada (slot ocupado)
- [ ] ✅ Emails funcionando correctamente
- [ ] ✅ Google Calendar sincronizado
- [ ] ✅ Airtable actualizándose correctamente

---

**¡Listo!** 🎉 Tu sistema de reservas está completamente funcional.

**Última actualización:** 26 de diciembre de 2024
