# Renovar Token de WhatsApp Business API

**Business Account ID:** 4452362868379303 ✓

## 🔴 Token Expirado

**Error actual:** "The session is invalid because the user logged out"

**Causa:** El access token ha expirado (válidos 24h-60 días según tipo)

---

## ✅ Generar Nuevo Token (2 minutos)

### En la Pantalla que Ves Ahora

**En https://developers.facebook.com/apps:**

1. **Menu lateral izquierdo:** Busca "**WhatsApp**" o "**Products**"
   - Si no lo ves, click en "+ Add Product"
   - Selecciona "WhatsApp" → Set up

2. **Una vez en WhatsApp, busca:**
   - "**API Setup**" o
   - "**Getting Started**" o
   - "**Configuration**"

3. **Verás una sección con:**
   ```
   Temporary access token
   [Long token string...]
   [Copy icon]
   ```

4. **Click en el icono de copiar** 📋

---

## 📋 Credenciales que Necesitas

### 1. Access Token (Temporal - 24h)

**Dónde:** WhatsApp → API Setup → "Temporary access token"

**Se ve así:**
```
EAAXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Cópialo y guárdalo.**

### 2. Phone Number ID (Permanente)

**Dónde:** WhatsApp → API Setup → "Phone number ID" o "From"

**Se ve así:**
```
123456789012345
```

**Cópialo también.**

### 3. Business Account ID (Ya lo tienes) ✓

```
4452362868379303
```

---

## 🔧 Actualizar en n8n

**Con el nuevo token:**

1. **Ve a:** https://n8n.happyhub.es
2. **Workflow → Nodo "WhatsApp Cliente"**
3. **Headers → Authorization:**
   ```
   Bearer NUEVO_TOKEN_AQUI
   ```
4. **URL (actualiza con Phone Number ID):**
   ```
   https://graph.facebook.com/v21.0/TU_PHONE_NUMBER_ID/messages
   ```
5. **Repite para "WhatsApp Admin"**
6. **Save**

---

## 🔒 Token Permanente (Recomendado)

**Los tokens temporales expiran cada 24h.**

### Para Token de 60 Días:

1. **Business Settings** (en el menu de Meta)
2. **System Users** → Create system user
3. **Assets** → Assign WhatsApp app
4. **Generate Token** → Selecciona permisos:
   - ✓ whatsapp_business_messaging
   - ✓ whatsapp_business_management
5. **Copy token** (válido 60 días)

---

## 🧪 Test del Token

**Verifica que el token funciona:**

```bash
curl -X POST "https://graph.facebook.com/v21.0/TU_PHONE_ID/messages" \
  -H "Authorization: Bearer NUEVO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "34624645517",
    "type": "text",
    "text": {"body": "Test token"}
  }'
```

**Si funciona:** Verás `{"messages":[{"id":"wamid.xxx"}]}`

**Si falla:** Token incorrecto o permisos faltantes

---

## 📝 Guardar Credenciales

**Después de obtenerlas:**

```bash
# En .env.local
WHATSAPP_BUSINESS_ACCOUNT_ID=4452362868379303
WHATSAPP_PHONE_NUMBER_ID=<copiar de Meta>
WHATSAPP_ACCESS_TOKEN=<copiar de Meta>
```

---

## 🎯 Siguiente Paso

**En la app de Meta que ves:**

1. **Busca menu "WhatsApp"** (puede estar en Products o Use Cases)
2. **Si no aparece:** + Add Product → WhatsApp
3. **Copia:** Access Token y Phone Number ID
4. **Pégalos aquí** y los guardo

**¿Encuentras la sección WhatsApp en el menú?**
