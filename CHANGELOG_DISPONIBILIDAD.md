# Changelog - Actualización Página de Disponibilidad

**Fecha:** 23 de diciembre de 2024
**Versión:** 2.0

## 🎯 Cambios Principales

### 1. **Calendario Más Grande**
- ✅ El calendario ahora ocupa todo el ancho de la pantalla
- ✅ Aplicado `scale-110` en mobile y `scale-125` en desktop para mayor visibilidad
- ✅ Centrado y con padding adicional para mejor UX

### 2. **Franjas Horarias Oficiales Implementadas**

#### **Mañanas (11:00 - 14:30h)**
- Apertura: 11:00h
- Cierre: 14:30h
- Apertura anticipada: 10:00h sin coste

#### **Tardes (16:30 - 20:30h)**
- Apertura: 16:30h
- Cierre: 20:30h
- Apertura anticipada: 15:30h sin coste

#### **Noches (22:00 - 02:00h)**
- Apertura: 22:00h
- Cierre: 02:00h (madrugada)
- Apertura anticipada: 21:30h sin coste
- **Nota:** Precio a consultar

### 3. **Sistema de Tarifas Dinámico**

#### **Lógica de Precios Implementada:**

| Día | Franja | Precio |
|-----|--------|--------|
| Lunes a Viernes | Mañana | 110€ |
| Lunes a Jueves | Tarde | 110€ |
| Viernes | Tarde | 140€ |
| Sábado, Domingo, Festivos | Mañana | 130€ |
| Sábado, Domingo, Festivos | Tarde | 170€ |
| Cualquier día | Noche | A consultar |

#### **Reglas de Negocio:**
- ✅ Detecta fines de semana (sábado/domingo)
- ✅ Detecta festivos (lista 2025 incluida)
- ✅ Detecta vísperas de festivos
- ✅ Viernes tarde = 140€ (víspera de festivo)
- ✅ Horario nocturno = "A consultar"

### 4. **Nueva Utilidad: `/src/utils/pricing.ts`**

Archivo creado con funciones para:
- `calculateBasePrice()` - Calcula precio según día y horario
- `getPriceLabel()` - Formatea precio para mostrar
- `getDayTypeDescription()` - Describe tipo de día
- `getAvailableTimeSlotsWithPricing()` - Obtiene franjas con precios
- `isWeekend()`, `isHoliday()`, `isHolidayEve()`, `isFriday()` - Helpers

### 5. **UX Mejorada**

#### **Selección de Horario:**
- Cards grandes con hover effect
- Muestra precio en grande
- Descripción de horario y apertura anticipada
- Indicador visual de selección (border + shadow + scale)
- Badge especial para "A consultar"

#### **Panel de Resumen:**
- Sticky a la derecha
- Muestra fecha y horario seleccionado
- Precio destacado en grande
- Botón "Consultar" para horario nocturno
- Botón "Continuar" para horarios con precio

#### **Información Adicional:**
- Box azul con info sobre tarifas
- Mención explícita de apertura anticipada
- Recordatorio sobre servicios extras

### 6. **Sección "Información Importante" Actualizada**

Grid con 6 bloques informativos:
1. ⏰ **Franjas Horarias** - Horarios oficiales
2. 💰 **Tarifas** - Todos los precios
3. 💳 **Forma de Pago** - Depósito 30%
4. 🔄 **Cancelaciones** - Gratuita 15 días antes
5. 👥 **Capacidad** - Hasta 150 personas
6. 🎉 **Servicios Extras** - Recordatorio de servicios adicionales

### 7. **CLAUDE.md Actualizado**

Agregada sección completa:
```markdown
## Business Rules - Horarios y Tarifas

### Franjas Horarias Disponibles
[...]

### Tarifas Oficiales
[...]

### Reglas de Negocio para Tarifas
[...]
```

## 📂 Archivos Modificados

1. ✅ `/src/pages/disponibilidad.tsx` - Página completa rediseñada
2. ✅ `/src/utils/pricing.ts` - **NUEVO** - Sistema de pricing
3. ✅ `/CLAUDE.md` - Documentación actualizada

## 🔄 Cambios en el Flujo de Usuario

### **Antes:**
1. Usuario selecciona fecha
2. Ve horarios genéricos (10:00, 12:00, 16:00, 18:00)
3. Selecciona duración (2h, 3h, 4h, 5h)
4. Ve precio fijo sin considerar día/horario

### **Ahora:**
1. Usuario ve **calendario GRANDE**
2. Selecciona fecha → Ve tipo de día (laborable/festivo/fin de semana)
3. Ve **3 franjas horarias** con precios específicos:
   - Mañana: [precio calculado]
   - Tarde: [precio calculado]
   - Noche: A consultar
4. Selecciona franja → Ve horario exacto y apertura anticipada
5. Para noche: Redirige a contacto
6. Para otros: Continúa a reserva con precio correcto

## 🎨 Mejoras Visuales

- Calendario: `scale-110` mobile, `scale-125` desktop
- Cards de horario: Bordes redondeados, hover effects, selección visual
- Precios: Tamaño grande (3xl), colores destacados
- Layout: Responsive optimizado (1 col mobile, 3 cols desktop)
- Info boxes: Bordes de colores (primary/secondary alternados)

## ⚠️ Notas Importantes

### **Festivos 2025 Incluidos:**
- 01/01 - Año Nuevo
- 06/01 - Reyes
- 18/04 - Viernes Santo
- 01/05 - Día del Trabajo
- 15/08 - Asunción
- 12/10 - Fiesta Nacional
- 01/11 - Todos los Santos
- 06/12 - Constitución
- 08/12 - Inmaculada
- 25/12 - Navidad

### **TODO: Actualizar para 2026**
Cuando llegue 2026, actualizar el array `holidays2025` en `/src/utils/pricing.ts`

## 🚀 Próximos Pasos Sugeridos

1. **Integrar con backend:**
   - Actualizar `/api/webhook-reserva.ts` para recibir `timeSlot`
   - Pasar `timeSlot` al flujo n8n
   - Calcular precio en backend también

2. **Página de reservas:**
   - Actualizar `/pages/reservas.tsx` para usar nuevo sistema
   - Pre-seleccionar fecha y horario desde query params
   - Mostrar precio calculado automáticamente

3. **Base de datos de festivos:**
   - Crear tabla de festivos en Airtable
   - Agregar API endpoint para obtener festivos
   - Actualizar `isHoliday()` para usar API

4. **Admin dashboard:**
   - Permitir configurar festivos desde admin
   - Permitir ajustar tarifas por franja/día
   - Mostrar calendario con reservas por franja horaria

## 🧪 Testing

### **Casos de Prueba:**

1. **Lunes (laborable) - Mañana:**
   - ✅ Debería mostrar 110€

2. **Viernes (laborable) - Tarde:**
   - ✅ Debería mostrar 140€ (víspera)

3. **Sábado (fin de semana) - Tarde:**
   - ✅ Debería mostrar 170€

4. **Domingo (fin de semana) - Mañana:**
   - ✅ Debería mostrar 130€

5. **Cualquier día - Noche:**
   - ✅ Debería mostrar "A consultar"
   - ✅ Botón cambia a "Consultar disponibilidad"

6. **25 de diciembre (festivo) - Tarde:**
   - ✅ Debería mostrar 170€

### **Para Probar:**
```bash
npm run dev
# Navegar a http://localhost:3000/disponibilidad
# Probar diferentes fechas y horarios
```

## 📸 Capturas de Pantalla

Recomendado documentar:
- [ ] Calendario grande (antes/después)
- [ ] Selección de franjas horarias
- [ ] Panel de resumen con precio
- [ ] Sección de información
- [ ] Vista mobile responsive

## 👨‍💻 Desarrolladores

Si necesitas modificar precios o horarios:

1. **Cambiar precios:** Editar constantes en `calculateBasePrice()` en `/src/utils/pricing.ts`
2. **Cambiar horarios:** Editar `TIME_SLOTS` array en `/src/utils/pricing.ts`
3. **Agregar festivos:** Actualizar `holidays2025` array en `isHoliday()`
4. **Cambiar reglas:** Modificar lógica en `calculateBasePrice()`

## ✅ Checklist de Implementación

- [x] Crear `/src/utils/pricing.ts`
- [x] Actualizar `/src/pages/disponibilidad.tsx`
- [x] Actualizar `/CLAUDE.md`
- [x] Calendario más grande
- [x] 3 franjas horarias implementadas
- [x] Sistema de tarifas dinámico
- [x] UX mejorada con visual feedback
- [x] Información completa sobre tarifas
- [ ] Testing en dev
- [ ] Testing en diferentes fechas
- [ ] Integración con página de reservas
- [ ] Integración con n8n workflow
- [ ] Deploy a producción

---

**Última actualización:** 23 de diciembre de 2024
**Versión:** 2.0.0
