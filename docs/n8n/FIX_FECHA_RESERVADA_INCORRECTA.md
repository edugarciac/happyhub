# Fix: n8n Dice Fecha Reservada Cuando Está Libre

## 🐛 Problema

El workflow siempre responde "fecha reservada" incluso cuando está libre.

**En BD solo hay:** 1 reserva (20-02-2026 afternoon)
**Pero n8n rechaza:** TODAS las fechas

## 🎯 Causa

El nodo IF "¿Fecha Disponible?" está evaluando mal. Posiblemente:
1. La condición está **invertida**
2. O el formato de datos del SQL no es correcto

## ✅ Solución en n8n

### Paso 1: Verificar el Nodo IF

**En https://n8n.happyhub.es → Workflow → Click en "¿Fecha Disponible?"**

**Condición actual probablemente es:**
```javascript
{{ $json.length || 0 }} equal 0
```

**ESTO ESTÁ MAL** porque:
- SQL con "Always Output Data" puede retornar `{}` (objeto vacío)
- `{}.length` = `undefined`
- La condición siempre falla

### Paso 2: Cambiar a Condición Correcta

**BORRA la condición actual y usa:**

**Opción A (Más simple):**
```
Condition Type: Boolean
Expression: {{ $input.all().length === 0 }}
```

**Lógica:**
- Si SQL encontró reserva: array tiene 1+ elementos → FALSE (no disponible) ✓
- Si SQL NO encontró reserva: array vacío → TRUE (disponible) ✓

**Opción B (Más robusta):**
```
Condition Type: Boolean
Expression: {{ !$json[0] || !$json[0].id }}
```

**Lógica:**
- Si SQL retornó fila con id: FALSE (no disponible) ✓
- Si SQL retornó vacío: TRUE (disponible) ✓

### Paso 3: Verificar Conexiones

**TRUE branch (disponible):**
- Debe ir a → "Guardar en Neon DB"

**FALSE branch (ocupada):**
- Debe ir a → "Respuesta: No Disponible" (409)

**Si están INVERTIDAS, intercámbialas.**

### Paso 4: Test

**Execute Workflow** con datos de prueba:

```json
{
  "name": "Test",
  "email": "test@test.com",
  "phone": "612345678",
  "date": "2026-03-15",
  "time": "afternoon",
  "guests": 30,
  "totalPrice": 185
}
```

**15 de marzo** NO está ocupada, debe:
- ✅ Ir a TRUE branch
- ✅ Crear reserva en BD
- ✅ Responder 200

**Test con fecha ocupada (20-02-2026 afternoon):**
```json
{
  "date": "2026-02-20",
  "time": "afternoon",
  ...
}
```

Debe:
- ✅ Ir a FALSE branch
- ✅ Responder 409

## 🔍 Debug: Ver Qué Retorna el SQL

**Añade nodo Code después del SQL:**

```javascript
console.log('SQL output type:', typeof $json);
console.log('SQL output:', JSON.stringify($json));
console.log('Is array?', Array.isArray($json));
console.log('Length:', $json?.length);
console.log('First item:', $json[0]);
console.log('Input all:', $input.all());

return $input.all();
```

**Execute y mira los logs** para ver el formato exacto.

---

## ✅ Quick Fix Visual

**Si no quieres cambiar mucho:**

1. Click en nodo IF
2. **Delete condition** actual
3. **Add condition:**
   - Type: **Boolean**
   - Value 1: `{{ $input.all().length === 0 }}`
4. Save
5. Test

Esto debe funcionar al 100%.
