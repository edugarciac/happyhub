## Why

La política de cancelación era incoherente entre páginas (15 días en la home y disponibilidad, 3 días en términos, FAQ, contacto, contrato y PDF; cambio de fecha "hasta 30 días"). Ante una contradicción se aplica la versión más favorable al cliente. Además, la norma de tabaco no mencionaba los vapers.

## What Changes

- Nueva política única en toda la plataforma:
  - 15 días o más antes del evento: devolución del 100% del depósito.
  - Entre 14 y 3 días antes: sin devolución; se puede cambiar la fecha (sujeto a disponibilidad).
  - Menos de 3 días: sin devolución ni cambio de fecha.
- Se elimina "cambio de fecha gratuito hasta 30 días antes".
- Prohibición explícita de cigarrillos y vapers / cigarrillos electrónicos en FAQ, términos, contrato y PDF.
- `TERMS_LAST_UPDATED` pasa a 17 de octubre de 2026.

## Capabilities

### Modified Capabilities

- `booking-policies`: política de cancelación y norma de tabaco/vapeo.

## Impact

Solo textos: `PricingTable.tsx`, `TermsContent.tsx`, `como-funciona.tsx`, `contacto.tsx`, `disponibilidad.tsx`, `mi-reserva/[id].tsx`, `lib/pdf.ts`, `admin/reservations/[id]/contract.tsx`. Sin cambios de base de datos ni de cobro; las devoluciones siguen siendo manuales.
