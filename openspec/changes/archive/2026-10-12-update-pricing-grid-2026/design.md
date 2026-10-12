## Context

Los precios viven en `pricing_rules` (editables desde `/admin/pricing`) y se exponen en `/api/pricing/current`. Cinco componentes cliente repetían la misma lógica para elegir la regla y todos usaban `pricing[ruleKey] || 110`, de modo que un precio 0 ("A consultar") se convertía en 110 €. `isHoliday` usaba `toISOString()`, que para fechas creadas a medianoche local (calendario) en España devuelve el día anterior.

## Goals / Non-Goals

**Goals:**
- Aplicar la nueva parrilla en BD, fallbacks y UI.
- Festivos y vísperas → "A consultar" en ambas franjas, sin permitir reservar online esas fechas.
- Una única fuente de lógica de selección de regla.

**Non-Goals:**
- Cambiar el esquema de `pricing_rules` ni añadir reglas nuevas (se reutilizan `holiday_*`).
- Gestionar la reserva de festivos desde la web (se derivan a contacto).

## Decisions

1. **Vísperas reutilizan `holiday_*`**: la parrilla las trata igual que festivos; evitar una regla `holiday_eve_*` mantiene el admin simple. Si algún día difieren, se añade la regla y se cambia solo `getPricingRuleKey`.
2. **Prioridad**: festivo/víspera > fin de semana > viernes tarde > laborable. Un sábado víspera de festivo es "A consultar".
3. **0 o regla ausente → 'consult'**: nunca cobrar un precio inventado; mejor bloquear y derivar a contacto.
4. **Fecha local en `isHoliday`**: `YYYY-MM-DD` con `getFullYear/getMonth/getDate`.
5. **Mensaje de bloqueo genérico** en Step1: "Esta fecha tiene precio a consultar (festivos, vísperas o franja nocturna). Contacta con nosotros."

## Risks / Trade-offs

- [Riesgo] La migración hay que ejecutarla en Neon (o editar en `/admin/pricing`); hasta entonces la web muestra los precios viejos → Mitigación: indicado en tasks.
- [Riesgo] Las fechas de `holidays` deben estar completas para que las vísperas se detecten (p.ej. 31/12 necesita el 01/01 del año siguiente) → Revisar en `/admin/holidays`.
