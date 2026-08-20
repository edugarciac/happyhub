## Why

The booking terms and conditions text states "El resto del pago se realizará el día del evento" (the rest of the payment will be made on the day of the event). This is inaccurate: payment must be completed before the event starts, not during or at the end of it. The wording should reflect that the remaining balance is due before the event begins.

## What Changes

- Update the terms and conditions copy shown in Step 3 of the booking flow so it reads "El resto del pago se realizará antes de comenzar el evento." instead of "...el día del evento."

## Capabilities

### New Capabilities

<!-- No new capabilities -->

### Modified Capabilities

- `booking-terms`: The displayed terms and conditions text for the remaining balance payment timing is corrected.

## Impact

- **Frontend**: `src/components/booking/Step3CustomerData.tsx` — terms and conditions list item copy
- No API, DB, or workflow changes needed
