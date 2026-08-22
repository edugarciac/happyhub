## Context

El horario de la franja de mañana estaba definido de forma centralizada en `src/utils/pricing.ts` (`TIME_SLOTS`), pero el string de horario "11:00-14:30" estaba también hardcodeado en más de 15 archivos (componentes de UI, páginas, panel de admin, generación de PDF/WhatsApp/checkout de Stripe), ya que no existe un único punto de formateo del label de franja horaria en toda la base de código.

## Goals / Non-Goals

**Goals:**
- Reflejar el nuevo horario oficial de mañana (10:00-14:00) en todos los lugares donde se muestra o se usa para lógica de negocio (creación de reservas, contratos, bloqueo de fechas)
- Mantener sin cambios los precios (importes) y el resto de franjas (tarde, noche)

**Non-Goals:**
- Refactorizar los ~15 sitios con el string de horario hardcodeado en una única fuente de verdad reutilizable — fuera del alcance de este cambio puntual, aunque sería una mejora futura razonable
- Cambiar la lógica de clasificación de eventos de Google Calendar (`google-calendar-slots.ts`), ya que el rango `startHour >= 10 && startHour < 15` ya englobaba correctamente 10:00-14:00

## Decisions

1. **Se elimina `earlyOpenTime` de la franja de mañana en `pricing.ts`**: antes el horario "oficial" era 11:00-14:30 con acceso gratuito desde las 10:00; ahora 10:00 pasa a ser el inicio oficial, por lo que el concepto de apertura anticipada para mañana deja de aplicar (ya está incluido).
2. **Cambio puramente de horario**, no de precio: `calculateBasePrice` no se modifica, solo las horas mostradas/usadas.
3. **`block-dates.ts` ya tenía `start: '10:00'`** (inconsistente con los `11:00` del resto del sistema) — se corrige `end` a `14:00` para quedar alineado con el nuevo horario oficial.

## Risks / Trade-offs

- [Riesgo] Al no centralizar el string de horario, un futuro cambio de horario requerirá tocar de nuevo múltiples archivos → Aceptado: mismo patrón que ya existía antes de este cambio, no se introduce deuda nueva.
