## Context

El horario de la franja de tarde estaba definido de forma centralizada en `src/utils/pricing.ts` (`TIME_SLOTS`), pero el string de horario "16:30-20:30" estaba también hardcodeado en más de 15 archivos (componentes de UI, páginas, panel de admin, generación de PDF/WhatsApp/checkout de Stripe), siguiendo el mismo patrón que el cambio previo de la franja de mañana (`update-morning-slot-hours`).

## Goals / Non-Goals

**Goals:**
- Reflejar el nuevo horario oficial de tarde (16:00-20:00) en todos los lugares donde se muestra o se usa para lógica de negocio (creación de reservas, contratos, bloqueo de fechas)
- Mantener sin cambios los precios (importes) y el resto de franjas (mañana, noche)

**Non-Goals:**
- Refactorizar los ~15 sitios con el string de horario hardcodeado en una única fuente de verdad reutilizable — fuera del alcance de este cambio puntual (mismo non-goal que el cambio previo de mañana)
- Cambiar la lógica de clasificación de eventos de Google Calendar (`google-calendar-slots.ts`), ya que el rango `startHour >= 15 && startHour < 21` ya engloba correctamente 16:00-20:00

## Decisions

1. **Se elimina `earlyOpenTime` de la franja de tarde en `pricing.ts`**: antes el horario "oficial" era 16:30-20:30 con acceso gratuito desde las 15:30; ahora 16:00 pasa a ser el inicio oficial, por lo que el concepto de apertura anticipada para tarde deja de aplicar (ya está incluido). La noche mantiene su apertura anticipada sin cambios.
2. **Cambio puramente de horario**, no de precio: `calculateBasePrice` no se modifica, solo las horas mostradas/usadas.
3. **`block-dates.ts` tenía `start: '15:30'`** (la hora de apertura anticipada) — se corrige a `16:00` y `end` a `20:00` para quedar alineado con el nuevo horario oficial sin apertura anticipada.
4. **Textos de "acceso anticipado sin coste"** en `disponibilidad.tsx` y `como-funciona.tsx` se actualizan para dejar de mencionar la tarde, ya que esa franja deja de tener apertura anticipada.

## Risks / Trade-offs

- [Riesgo] Al no centralizar el string de horario, un futuro cambio de horario requerirá tocar de nuevo múltiples archivos → Aceptado: mismo patrón que ya existía antes de este cambio, no se introduce deuda nueva.
