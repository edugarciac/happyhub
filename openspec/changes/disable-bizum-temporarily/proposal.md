## Why
The owner wants to stop accepting Bizum for the deposit for a while. Customers must not be able to choose it or see Bizum instructions, and it must be easy to switch back on.

## What Changes
- New flag `BIZUM_ENABLED` in `src/config/payments.ts` (set to `false`).
- Booking form: "Tarjeta" is preselected; "Bizum" is shown greyed out with a "No disponible por ahora" badge and cannot be selected.
- Booking API rejects `bizum` while the flag is off.
- Payment page `/pagar/[token]` and deposit emails show only card payment, including for reservations that chose Bizum earlier.
- "Cómo funciona" text no longer mentions Bizum for the deposit while the flag is off.

## Out of scope
- Terms and conditions text (versioned; changing it changes the accepted-terms version). It still says the deposit can be paid "o Bizum".
- Admin tools: marking a Bizum deposit as received still works for transfers already sent.
- Removing Bizum data/types: reservations stored with `bizum` stay valid.

## Impact
`src/config/payments.ts`, `src/components/booking/Step3CustomerData.tsx`, `src/pages/api/webhook-reserva.ts`, `src/pages/pagar/[token].tsx`, `src/lib/emailTemplates.ts`, `src/pages/como-funciona.tsx`.
