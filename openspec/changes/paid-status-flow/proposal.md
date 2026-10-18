## Why

Tras pagar la señal la reserva aparece como «Confirmada» y ya ofrece «Marcar Realizado», aunque el resto no esté cobrado. El admin no ve de un vistazo qué reservas tienen solo la señal y cuáles están pagadas del todo, y puede cerrar un evento sin cobrar.

## What Changes

- Estado visible según lo pagado: **Señal pagada** (señal cobrada, resto pendiente) y **Pagado** (total cobrado).
- En «Señal pagada» aparece el botón **Marcar pago total** (método: datáfono, efectivo o transferencia). El pago del resto por Stripe (QR, correo del día, recordatorio) lo marca solo.
- **Marcar Realizado** solo aparece, y la API solo lo permite, cuando la reserva está **Pagado**.
- Filtro del listado: «Señal pagada» y «Pagado» en lugar de «Confirmada».

## Impact

- `src/utils/reservationStatus.ts`, `src/__tests__/reservationStatus.test.ts`
- `src/pages/admin/reservations/index.tsx`, `src/components/admin/DayOfPaymentModal.tsx`
- `src/pages/api/admin/reservations/[id]/status.ts`, `src/pages/api/admin/reservations/[id]/mark-remaining-paid.ts`, `src/pages/api/admin/reservations.ts`
