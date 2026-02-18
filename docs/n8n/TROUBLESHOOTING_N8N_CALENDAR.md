# 🔧 Troubleshooting: Google Calendar en n8n

## 🎯 Problema

El workflow se detiene en el nodo "Google Calendar - Verificar Disponibilidad" y muestra "No output data returned".

---

## 🔍 Diagnóstico

### Paso 1: Verificar Credenciales

1. En n8n, ve a **Settings** → **Credentials**
2. Encuentra: `Google Calendar happyhub.rovellat`
3. Click **Edit**
4. Click **Test** o **Reconnect**
5. Verifica que la autorización funcione

**Si falla:** Vuelve a autorizar con la cuenta correcta.

---

### Paso 2: Verificar Configuración del Nodo

En el nodo "Google Calendar - Verificar Disponibilidad":

#### Configuración Correcta:

```
Resource: Event
Operation: Get Many
Calendar: ={{$json.calendarId}}
Return All: false (toggle OFF)
Limit: 100
```

#### Options (expandir):

```
After: ={{$json.startDateTime}}
Before: ={{$json.endDateTime}}
```

**NO uses:** `timeMin` o `timeMax` en Options. Usa `After` y `Before`.

---

### Paso 3: Verificar Formato de Fechas

El nodo "Preparar Datos" debe generar fechas en formato **ISO 8601 con Z (UTC)**.

#### Formato Correcto:
```
startDateTime: "2025-12-26T15:30:00.000Z"
endDateTime: "2025-12-26T19:30:00.000Z"
```

#### Formato Incorrecto:
```
❌ "2025-12-26T16:30:00" (sin timezone)
❌ "2025-12-26T16:30:00+01:00" (puede causar problemas)
```

---

## 🛠️ Solución Rápida

### Opción 1: Código Actualizado para "Preparar Datos"

Usa este código (ya actualizado en `preparar-datos-code.js`):

```javascript
const data = items[0].json.body || items[0].json;

const eventDate = new Date(data.date);

const timeSlots = {
  morning: {
    start: '11:00:00',
    end: '14:30:00',
    label: 'Mañana (11:00-14:30)'
  },
  afternoon: {
    start: '16:30:00',
    end: '20:30:00',
    label: 'Tarde (16:30-20:30)'
  },
  night: {
    start: '22:00:00',
    end: '02:00:00',
    label: 'Noche (22:00-02:00)'
  }
};

const slot = timeSlots[data.timeSlot];

if (!slot) {
  throw new Error(`Invalid timeSlot: ${data.timeSlot}`);
}

// Crear fechas UTC
const startDate = new Date(`${data.date}T${slot.start}`);
const endDate = new Date(`${data.date}T${slot.end}`);

if (data.timeSlot === 'night') {
  endDate.setDate(endDate.getDate() + 1);
}

const startDateTime = startDate.toISOString();
const endDateTime = endDate.toISOString();

const formattedDate = eventDate.toLocaleDateString('es-ES', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const paymentLabels = {
  card: 'Tarjeta',
  bizum: 'Bizum',
  cash: 'Efectivo'
};

const eventTypeLabels = {
  'cumpleaños': 'Cumpleaños',
  'celebracion-familiar': 'Celebración familiar',
  'eventos-amigos': 'Eventos con amigos',
  'eventos-colegio-trabajo': 'Eventos de colegio o trabajo',
  'taller': 'Taller',
  'otros': 'Otros'
};

return [{
  json: {
    ...data,
    startDateTime,
    endDateTime,
    timeSlotLabel: slot.label,
    formattedDate,
    paymentMethodLabel: paymentLabels[data.paymentMethod] || data.paymentMethod,
    eventTypeLabel: eventTypeLabels[data.eventType] || data.eventType,
    calendarId: 'happyhub.rovellat@gmail.com'
  }
}];
```

---

### Opción 2: Simplificar el Nodo de Google Calendar

Si sigue sin funcionar, prueba esta configuración más simple:

1. **Elimina el nodo actual** "Google Calendar - Verificar Disponibilidad"
2. **Añade un nuevo nodo** Google Calendar
3. Configura así:

```
Resource: Event
Operation: Get Many
Calendar: happyhub.rovellat@gmail.com (escrito a mano, no expresión)
Return All: false
Limit: 100
```

**SIN opciones adicionales** (no uses After/Before/timeMin/timeMax)

Esto devolverá todos los eventos recientes. Luego añade un nodo "Code" después para filtrar manualmente.

---

### Opción 3: Workflow Simplificado (Sin Validación)

Si Google Calendar sigue dando problemas, puedes **omitir temporalmente la validación**:

1. Elimina el nodo "Google Calendar - Verificar Disponibilidad"
2. Elimina el nodo "¿Slot Ocupado?"
3. Elimina el nodo "Respuesta - Slot Ocupado"
4. Conecta directamente "Preparar Datos" → "Airtable - Crear Registro"

**Consecuencia:** No habrá validación de disponibilidad. Todas las solicitudes se crearán en Airtable como "pending" y deberás revisar manualmente en Google Calendar si hay conflictos.

---

## 🧪 Test Manual

Para verificar que Google Calendar funciona:

1. Crea un **nuevo workflow de prueba** simple
2. Añade solo:
   - Webhook trigger (manual)
   - Google Calendar node (Get Many)
   - Calendar: `happyhub.rovellat@gmail.com`
   - Sin opciones adicionales
3. **Ejecuta** manualmente
4. Verifica que devuelve eventos

Si este test funciona, el problema está en los parámetros `After`/`Before`.

---

## 🎯 Debugging Avanzado

### Ver Qué Envía n8n a Google Calendar

1. Click en el nodo "Google Calendar - Verificar Disponibilidad"
2. Click en **"Execute node"** (play button)
3. Mira el panel de salida
4. Si hay error, aparecerá el mensaje de Google Calendar API

### Errores Comunes:

**"Invalid time value"**
- Las fechas no están en formato correcto
- Solución: Verifica que sean ISO 8601

**"Not found"**
- La credencial no tiene acceso al calendario
- Solución: Vuelve a autorizar con la cuenta correcta

**"Unauthorized"**
- Token expirado
- Solución: Reconnect en las credenciales

---

## ✅ Solución Recomendada (Por Ahora)

**Para que funcione AHORA:**

1. **Usa la Opción 3** (workflow sin validación de Google Calendar)
2. Conecta directamente: `Preparar Datos` → `Airtable - Crear Registro`
3. Revisa manualmente en Google Calendar si hay conflictos
4. Una vez que funcione end-to-end, vuelve a añadir la validación

**Ventajas:**
- El flujo funciona inmediatamente
- Los emails se envían
- Airtable se actualiza
- Solo pierdes la validación automática (que puedes hacer manualmente)

---

## 📞 Próximos Pasos

1. Intenta el código actualizado (Opción 1)
2. Si no funciona, prueba la configuración simplificada (Opción 2)
3. Si sigue fallando, omite temporalmente la validación (Opción 3)
4. Una vez funcionando, podemos depurar Google Calendar con calma

---

**Última actualización:** 27 de diciembre de 2024
