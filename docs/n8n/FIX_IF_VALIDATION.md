# Fix: n8n IF Node - Validación de Fecha Disponible

## Problema

El nodo "¿Fecha Disponible?" no valida correctamente si el SELECT SQL retorna datos o no.

## Causa

Cuando el SQL no encuentra resultados (fecha disponible):
- Con "Always Output Data": puede pasar `{}` o `[]` o `[{}]`
- La condición `$json.length === 0` puede fallar dependiendo del formato

## ✅ Solución 1: Cambiar Condición del IF (Recomendado)

**En n8n.happyhub.es → Workflow → Click en nodo "¿Fecha Disponible?":**

**Cambiar de:**
```javascript
{{ $json.length || 0 }} equal 0
```

**A:**
```javascript
{{ !$json.id }}
```

**Tipo:** Boolean (no number)

**Lógica:**
- Si SQL encontró conflicto: $json.id existe → `!$json.id = false` → FALSE branch (no disponible) ✓
- Si SQL no encontró nada: $json.id undefined → `!$json.id = true` → TRUE branch (disponible) ✓

## ✅ Solución 2: Verificar Longitud de Input

**Otra opción:**

```javascript
{{ $input.all().length === 0 }}
```

**Lógica:**
- `$input.all()` devuelve array de todos los items
- Si SQL retornó vacío: length === 0 → TRUE (disponible)
- Si SQL retornó fila: length > 0 → FALSE (no disponible)

## ✅ Solución 3: Usar Run Index

**La más robusta:**

```javascript
{{ $('Verificar Disponibilidad (Neon)').all().length === 0 }}
```

Esto accede directamente al output del nodo SQL por nombre.

## 🧪 Test de la Condición

**Después de cambiar:**

1. **Execute Workflow** (play ▶️)
2. **Con datos de prueba:**
   ```json
   {
     "name": "Test",
     "email": "test@test.com",
     "phone": "612345678",
     "date": "2026-05-15",
     "time": "afternoon",
     "guests": 30,
     "totalPrice": 185
   }
   ```

3. **Verifica que:**
   - ✅ TRUE branch ejecuta → Crea reserva
   - ✅ FALSE branch NO se ejecuta (si fecha libre)

4. **Test con fecha ocupada:**
   - Crea reserva manual en BD para esa fecha/hora
   - Ejecuta workflow de nuevo
   - ✅ FALSE branch debe ejecutar → Error 409

## 📊 Estructura Correcta del Flujo

```
Webhook
  ↓
Normalizar Datos
  ↓
SQL: SELECT id FROM reservations WHERE ...
  ↓ (Always Output Data = ON)
IF: $json.id === undefined?
  ↓                    ↓
  TRUE               FALSE
  (disponible)       (ocupada)
  ↓                    ↓
  INSERT             Response 409
  ↓
  Calendar
  ↓
  WhatsApp
  ↓
  Response 200
```

## 🔧 Configuración Correcta del Nodo SQL

**Nodo "Verificar Disponibilidad (Neon)":**

```
Query: SELECT id FROM reservations
       WHERE event_date = '{{ $json.fecha }}'
       AND time_slot = '{{ $json.timeSlot }}'
       AND status IN ('pending', 'confirmed')
       LIMIT 1

Settings:
  ✓ Always Output Data: ON
  ✓ Continue On Fail: ON (opcional)

Return Mode: Combine (no Multiple)
```

## 🎯 Verificación Final

**Ejecuta el workflow y mira cada nodo:**

1. **Webhook** → ¿Recibe datos? ✓
2. **Normalizar** → ¿Tiene fecha, timeSlot? ✓
3. **SQL Verificar** → ¿Ejecuta query? ¿Qué retorna?
4. **IF** → ¿Evalúa correctamente? ¿Qué branch toma?

**Si el IF siempre va a FALSE (ocupada):**
→ La condición está invertida

**Si el IF no evalúa:**
→ El formato de datos del SQL es incorrecto

---

**La mejor solución: Usar `{{ !$json.id }}` en el IF**
