## 1. Backend
- [x] 1.1 Migración 033 `reservation_charges` + runtime
- [x] 1.2 `src/utils/charges.ts` (conceptos, etiqueta, validación)
- [x] 1.3 `src/lib/reservationCharges.ts` (crear, listar, contacto, envío)
- [x] 1.4 API admin `GET/POST/PATCH /api/admin/reservations/[id]/charges`
- [x] 1.5 API pública `POST /api/payments/charge` (Stripe Checkout)
- [x] 1.6 Webhook: `extra_charge` → pagado + correos

## 2. Correos y páginas
- [x] 2.1 `extraChargeEmail` y `extraChargePaidEmail`
- [x] 2.2 Página `/pagar/cargo/[token]`
- [x] 2.3 Modal de cobros en el listado de reservas

## 3. Verify
- [x] 3.1 Tests de validación y correos
- [x] 3.2 Typecheck y tests pasan
