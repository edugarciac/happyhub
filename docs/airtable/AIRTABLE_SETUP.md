# Setup Airtable para HappyHub - Guía Completa

## ⚡ Inicio Rápido (15 minutos)

### Paso 1: Crear Cuenta Airtable (2 min)

1. Ve a: https://airtable.com/signup
2. Registrarte con: **hola@happyhub.es**
3. Verificar email
4. Login en: https://airtable.com/

---

## 📊 Paso 2: Crear Base de Datos (5 min)

### 2.1 Crear nueva base

1. Click en **"+ Create"** → **"Start from scratch"**
2. Nombre: **HappyHub Reservas**
3. Color: Naranja 🟠

### 2.2 Configurar tabla "Reservations"

Renombra la tabla default a **"Reservations"** y crea estos campos:

#### Campos principales:

| Campo | Tipo | Configuración |
|-------|------|---------------|
| **Reservation ID** | Autonumber | Primary field |
| **Status** | Single select | pending (🟡), approved (🟢), rejected (🔴), confirmed (✅), cancelled (⚫) |
| **Cliente - Nombre** | Single line text | |
| **Cliente - Email** | Email | |
| **Cliente - Teléfono** | Phone number | |
| **Evento - Tipo** | Single select | Cumpleaños, Celebración familiar, Eventos con amigos, Eventos de colegio o trabajo, Taller, Otros |
| **Evento - Fecha** | Date | Include time: No |
| **Evento - Franja** | Single select | Mañana (11:00-14:30), Tarde (16:30-20:30), Noche (22:00-02:00) |
| **Evento - Invitados** | Number | Integer, Min: 1, Max: 150 |
| **Extras** | Multiple select | Catering, Animación, Decoración, Fotografía, Tarta |
| **Precio Base** | Currency | EUR |
| **Precio Total** | Currency | EUR |
| **Método Pago** | Single select | Tarjeta, Bizum, Efectivo |
| **Mensaje Cliente** | Long text | |
| **Comentarios Admin** | Long text | |
| **Motivo Rechazo** | Long text | |
| **Google Calendar ID** | Single line text | |
| **Created** | Created time | |
| **Last Modified** | Last modified time | |
| **Reviewed At** | Date | Include time: Yes |

### 2.3 Configurar vistas

**Vista 1: Todas las Reservas**
- Nombre: "📋 Todas"
- Filtro: Ninguno
- Ordenar: Created (más reciente primero)

**Vista 2: Pendientes**
- Nombre: "⏳ Pendientes"
- Filtro: Status = pending
- Color: Amarillo

**Vista 3: Aprobadas**
- Nombre: "✅ Aprobadas"
- Filtro: Status = approved
- Color: Verde

**Vista 4: Calendario**
- Nombre: "📅 Calendario"
- Tipo: Calendar
- Campo fecha: Evento - Fecha

---

## 🔑 Paso 3: Obtener API Token (2 min)

### 3.1 Generar Personal Access Token

1. Click en tu perfil (arriba derecha)
2. **Account** → **Developer hub**
3. Click **"Personal access tokens"**
4. Click **"Create token"**
5. Nombre: **HappyHub n8n Integration**
6. Scopes:
   - ✅ `data.records:read`
   - ✅ `data.records:write`
   - ✅ `schema.bases:read`
7. Access: Selecciona tu base **"HappyHub Reservas"**
8. Click **"Create token"**
9. **Copia el token** (empieza con `pat...`)

⚠️ Guarda este token en lugar seguro, no se puede ver de nuevo.

### 3.2 Obtener Base ID y Table ID

1. Abre tu base **"HappyHub Reservas"**
2. En la URL verás algo como:
   ```
   https://airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY/...
   ```
3. Copia:
   - **Base ID**: `appXXXXXXXXXXXXXX`
   - **Table ID**: `tblYYYYYYYYYYYYYY`

---

## 🔄 Paso 4: Configurar n8n (5 min)

### 4.1 Acceder a n8n

```
https://n8n-n8n.ljmvxa.easypanel.host
```

### 4.2 Agregar credencial Airtable

1. Menu → **Credentials**
2. Click **"Add Credential"**
3. Buscar: **"Airtable"**
4. Seleccionar: **"Airtable Personal Access Token"**
5. Completar:
   ```
   Credential name: Airtable HappyHub
   Access Token: [tu pat_... token]
   ```
6. Click **"Test"** → Debe decir "Connection successful"
7. Click **"Save"**

### 4.3 Importar workflow Airtable

Voy a crear el workflow en el siguiente paso.

---

## 📝 Configuración de Campos en Airtable

### Valores predeterminados para "Status"

```
🟡 pending   - Nueva solicitud
🟢 approved  - Aprobada por admin
🔴 rejected  - Rechazada
✅ confirmed - Pago recibido
⚫ cancelled - Cancelada
```

### Valores para "Evento - Tipo"

```
🎂 Cumpleaños
👨‍👩‍👧‍👦 Celebración familiar
👥 Eventos con amigos
🏫 Eventos de colegio o trabajo
🎨 Taller
🎉 Otros
```

### Valores para "Evento - Franja"

```
🌅 Mañana (11:00-14:30)
🌆 Tarde (16:30-20:30)
🌙 Noche (22:00-02:00)
```

### Valores para "Extras"

```
🍽️ Catering
🎭 Animación
🎨 Decoración
📸 Fotografía
🎂 Tarta
```

### Valores para "Método Pago"

```
💳 Tarjeta
📱 Bizum
💵 Efectivo
```

---

## 🎨 Personalización Visual

### Colores recomendados por estado

En la vista, click en **"Color"** y asigna:
- 🟡 pending → Amarillo
- 🟢 approved → Verde
- 🔴 rejected → Rojo
- ✅ confirmed → Azul
- ⚫ cancelled → Gris

### Iconos para campos

Airtable añade iconos automáticamente, pero puedes personalizarlos:
- Fecha → 📅
- Email → 📧
- Teléfono → 📞
- Dinero → 💰

---

## 🔐 Guardar Credenciales Localmente

Crea un archivo local (NO subir a GitHub):

```bash
cat > airtable-credentials.json <<EOF
{
  "airtable": {
    "personal_access_token": "pat...",
    "base_id": "appXXXXXXXXXXXXXX",
    "table_id": "tblYYYYYYYYYYYYYY",
    "table_name": "Reservations",
    "base_name": "HappyHub Reservas"
  },
  "account": {
    "email": "hola@happyhub.es"
  },
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
```

Y agrega a `.env`:

```bash
cat >> .env <<EOF

# Airtable
AIRTABLE_TOKEN=pat...
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_ID=tblYYYYYYYYYYYYYY
EOF
```

---

## 📊 Fórmulas Útiles (Opcional)

### Campo calculado: "Días hasta evento"

Tipo: Formula
```
DATETIME_DIFF({Evento - Fecha}, TODAY(), 'days')
```

### Campo calculado: "Estado Color"

Tipo: Formula
```
IF({Status} = 'pending', '🟡',
IF({Status} = 'approved', '🟢',
IF({Status} = 'rejected', '🔴',
IF({Status} = 'confirmed', '✅',
IF({Status} = 'cancelled', '⚫', '')))))
```

---

## ✅ Checklist de Setup

- [ ] Cuenta Airtable creada
- [ ] Base "HappyHub Reservas" creada
- [ ] Tabla "Reservations" con todos los campos
- [ ] Vistas configuradas (Todas, Pendientes, Aprobadas, Calendario)
- [ ] Personal Access Token generado
- [ ] Base ID y Table ID copiados
- [ ] Credencial Airtable en n8n configurada
- [ ] Credenciales guardadas en archivos locales
- [ ] Variables en .env actualizadas

---

## 🆘 Troubleshooting

### Error: "Invalid API key"
- Verifica que copiaste el token completo (empieza con `pat`)
- Genera un nuevo token si es necesario

### Error: "Base not found"
- Verifica el Base ID en la URL de tu base
- Debe empezar con `app`

### No encuentro el Table ID
- Abre tu tabla en Airtable
- Click derecho en el nombre de la tabla
- "Copy table ID"

---

## 💰 Límites del Plan Gratuito

✅ **Incluido gratis:**
- 1,000 registros por base
- 2GB de almacenamiento
- 1,000 API calls/mes
- Vistas ilimitadas
- Colaboradores ilimitados
- Formularios básicos

⚠️ **Necesitarás Plus ($20/mes) cuando:**
- Superes 1,000 reservas
- Necesites más de 1,000 API calls/mes
- Quieras automations avanzadas

---

## 📱 Apps Móviles

Descarga la app de Airtable para gestionar reservas desde tu móvil:

- **iOS**: https://apps.apple.com/app/airtable/id914172636
- **Android**: https://play.google.com/store/apps/details?id=com.formagrid.airtable

---

## 🎯 Próximos Pasos

Una vez completado este setup:
1. ✅ Crear workflow n8n con Airtable
2. ✅ Probar flujo completo
3. ✅ Ver reservas en UI visual de Airtable

**Tiempo estimado total:** 15 minutos
**Costo:** $0 (plan gratuito)

¡Listo para crear el workflow n8n! 🚀
