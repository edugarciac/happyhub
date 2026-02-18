# 🔄 Actualización de Campos en Airtable

## 📊 Estado Actual

Tu tabla **tblReservas** tiene campos existentes, pero necesitan ajustes para que funcionen con los workflows de n8n.

### Campos Existentes vs Requeridos

| Campo Actual | Estado | Campo Requerido | Acción |
|--------------|--------|-----------------|--------|
| Nombre | ✅ | Cliente - Nombre | Renombrar |
| Email | ✅ | Cliente - Email | Renombrar |
| Teléfono | ✅ | Cliente - Teléfono | Renombrar |
| Fecha | ✅ | Evento - Fecha | Renombrar |
| Hora | ⚠️ | Evento - Franja | Renombrar + cambiar tipo |
| Personas | ✅ | Evento - Invitados | Renombrar |
| Duración | ❌ | - | **ELIMINAR** (no se usa) |
| TipoEvento | ✅ | Evento - Tipo | Renombrar |
| Extras | ✅ | Extras | ✅ OK |
| PrecioTotal | ✅ | Precio Total | Renombrar |
| MétodoPago | ✅ | Método Pago | Renombrar + actualizar opciones |
| Estado | ✅ | Status | Renombrar + actualizar opciones |
| EventoCalendarioID | ✅ | Google Calendar ID | Renombrar |
| FechaCreación | ✅ | Reviewed At | Renombrar |
| - | ❌ | **Precio Base** | **AÑADIR** (Number) |
| - | ❌ | **Mensaje Cliente** | **AÑADIR** (Long text) |

---

## 🎯 Opción Recomendada: Actualizar Airtable

**Ventaja:** Los workflows funcionarán tal cual están diseñados, con campos descriptivos y bien organizados.

### Pasos a seguir:

1. **Abre tu base en Airtable:**
   https://airtable.com/appAj3N7bMGIVBagd/tblGakVr6paaokq9N

2. **Renombrar campos existentes:**

   | De | A |
   |-----|---|
   | Nombre | Cliente - Nombre |
   | Email | Cliente - Email |
   | Teléfono | Cliente - Teléfono |
   | Fecha | Evento - Fecha |
   | Hora | Evento - Franja |
   | Personas | Evento - Invitados |
   | TipoEvento | Evento - Tipo |
   | PrecioTotal | Precio Total |
   | MétodoPago | Método Pago |
   | Estado | Status |
   | EventoCalendarioID | Google Calendar ID |
   | FechaCreación | Reviewed At |

3. **Eliminar campo:**
   - ❌ **Duración** (ya no se usa, ahora usamos franjas horarias)

4. **Actualizar campo "Evento - Franja":**
   - Tipo: **Single select**
   - Opciones:
     - `Mañana (11:00-14:30)` - Color: amarillo/naranja
     - `Tarde (16:30-20:30)` - Color: azul
     - `Noche (22:00-02:00)` - Color: morado

5. **Actualizar campo "Status":**
   - Tipo: **Single select**
   - Opciones:
     - `pending` - Color: amarillo
     - `approved` - Color: verde
     - `rejected` - Color: rojo
     - `confirmed` - Color: azul

6. **Actualizar campo "Método Pago":**
   - Tipo: **Single select**
   - Opciones:
     - `Tarjeta` (en lugar de "Stripe")
     - `Bizum` (añadir)
     - `Efectivo` (en lugar de "Otro")

7. **Añadir campos nuevos:**

   **Campo: Precio Base**
   - Tipo: Currency
   - Símbolo: € (Euro)
   - Precisión: 2 decimales

   **Campo: Mensaje Cliente**
   - Tipo: Long text
   - Descripción: "Mensaje o comentarios adicionales del cliente"

---

## 🔧 Opción Alternativa: Actualizar Workflows

Si prefieres mantener los nombres de campos actuales, puedo modificar los workflows de n8n para que usen tus nombres.

**Desventaja:** Los nombres de campos serán menos descriptivos y organizados.

---

## ✅ Recomendación

**Te recomiendo la Opción 1 (actualizar Airtable)** porque:
- Los campos quedan mejor organizados (Cliente -, Evento -)
- Es más fácil de mantener a largo plazo
- Los workflows ya están optimizados para estos nombres
- Solo son cambios de nombre, no pierdes datos

Toma 5-10 minutos hacer los cambios en Airtable.

---

## 📋 Checklist de Cambios en Airtable

Una vez que actualices, verifica:

- [ ] Todos los campos renombrados correctamente
- [ ] Campo "Duración" eliminado
- [ ] Campo "Evento - Franja" con 3 opciones (Mañana, Tarde, Noche)
- [ ] Campo "Status" con 4 opciones (pending, approved, rejected, confirmed)
- [ ] Campo "Método Pago" con 3 opciones (Tarjeta, Bizum, Efectivo)
- [ ] Campo "Precio Base" añadido (Currency €)
- [ ] Campo "Mensaje Cliente" añadido (Long text)

---

**¿Qué prefieres?**
1. ✅ Actualizar los campos en Airtable (5-10 min)
2. 🔧 Que yo modifique los workflows para usar tus nombres actuales

Déjame saber y procedo con la opción que elijas.
