# 🔄 Actualizar Tipos de Evento en Airtable

## 📋 Cambios Necesarios

Los tipos de evento han cambiado. Necesitas actualizar el campo "Evento - Tipo" en tu base de Airtable.

---

## 🎯 Tipos de Evento ANTIGUOS (eliminar)

- ❌ Comunión
- ❌ Bautizo
- ❌ Otro

---

## ✅ Tipos de Evento NUEVOS (añadir)

1. 🎂 **Cumpleaños** (mantener)
2. 👨‍👩‍👧‍👦 **Celebración familiar** (nuevo)
3. 👥 **Eventos con amigos** (nuevo)
4. 🏫 **Eventos de colegio o trabajo** (nuevo)
5. 🎨 **Taller** (nuevo)
6. 🎉 **Otros** (reemplaza "Otro")

---

## 📝 Pasos para Actualizar en Airtable

### 1. Abre tu base de Airtable

https://airtable.com/appAj3N7bMGIVBagd/tblGakVr6paaokq9N

### 2. Edita el campo "Evento - Tipo"

1. Click en la **cabecera de la columna** "Evento - Tipo"
2. Click en **"Customize field type"** (icono de engranaje)
3. Verás la lista de opciones actuales

### 3. Elimina las opciones antiguas

- Click en la **X** de cada opción antigua:
  - ❌ Comunión
  - ❌ Bautizo
  - ❌ Otro

### 4. Añade las nuevas opciones

Click en **"Add an option"** y añade una por una:

```
Celebración familiar
Eventos con amigos
Eventos de colegio o trabajo
Taller
Otros
```

### 5. Asigna colores (opcional pero recomendado)

- 🎂 Cumpleaños → Color: rosa/rojo
- 👨‍👩‍👧‍👦 Celebración familiar → Color: azul
- 👥 Eventos con amigos → Color: morado
- 🏫 Eventos de colegio o trabajo → Color: verde
- 🎨 Taller → Color: naranja
- 🎉 Otros → Color: gris

### 6. Guarda los cambios

Click en **"Save"** o click fuera del modal

---

## ⚠️ Importante

### Si ya tienes registros con los tipos antiguos:

Cuando elimines las opciones antiguas (Comunión, Bautizo, Otro), los registros que tenían esos valores **se quedarán vacíos**.

**Solución:**
1. Antes de eliminar, busca registros con esos valores
2. Cambia manualmente a las nuevas opciones apropiadas:
   - "Comunión" → "Celebración familiar"
   - "Bautizo" → "Celebración familiar"
   - "Otro" → "Otros"
3. Luego elimina las opciones antiguas

---

## ✅ Verificación

Una vez actualizado, verifica que:

- [ ] Las 6 opciones nuevas están configuradas
- [ ] Los registros antiguos han sido actualizados
- [ ] No hay registros con el campo vacío

---

## 🔗 Integración Automática

Una vez actualizado en Airtable:
- ✅ El formulario web ya está actualizado
- ✅ El workflow de n8n ya está actualizado
- ✅ La validación ya acepta los nuevos tipos

No necesitas cambiar nada más. Todo funcionará automáticamente.

---

**Última actualización:** 26 de diciembre de 2024
