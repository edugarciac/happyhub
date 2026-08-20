## Why

The booking terms and conditions text states "El resto del pago se realizará el día del evento" (the rest of the payment will be made on the day of the event). This is inaccurate: payment must be completed before the event starts, not during or at the end of it. The wording should reflect that the remaining balance is due before the event begins.

## What Changes

- Update every screen and message that states the remaining balance is paid "el día del evento" so it says "antes de comenzar el evento" instead — not just the contract PDF, but every client-facing surface: the booking flow's terms and conditions, `/terminos`, `/como-funciona`, `/disponibilidad`, `/mi-reserva/[id]`, the pricing table, the price summary and confirmation steps of the booking wizard, and the WhatsApp confirmation message

## Capabilities

### New Capabilities

<!-- No new capabilities -->

### Modified Capabilities

- `booking-terms`: The displayed terms and conditions text for the remaining balance payment timing is corrected, consistently across every screen and message where it appears (not only the contract).

## Impact

- **Frontend**: `src/components/booking/Step3CustomerData.tsx`, `src/components/PricingTable.tsx`, `src/components/booking/PriceSummary.tsx`, `src/components/booking/Step4Confirmation.tsx`, `src/pages/terminos.tsx`, `src/pages/como-funciona.tsx`, `src/pages/disponibilidad.tsx`, `src/pages/mi-reserva/[id].tsx` — remaining-balance copy
- **Contract PDF**: `src/lib/pdf.ts` (`generateContractPDF`) — terms and conditions list item copy
- **WhatsApp**: `src/lib/whatsapp.ts` — reservation confirmation message copy
- No API, DB, or workflow changes needed
