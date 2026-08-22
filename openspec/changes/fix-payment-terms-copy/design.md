## Context

`Step3CustomerData.tsx` renders a static terms and conditions list inside the booking flow. One bullet currently reads "El resto del pago se realizará el día del evento." which implies payment could be settled during/at the event itself, rather than beforehand.

The generated contract PDF (`src/lib/pdf.ts`, `generateContractPDF`) has the same issue in its own terms and conditions list: "3. El resto del importe debe abonarse el día del evento."

## Goals / Non-Goals

**Goals:**
- Correct the copy to state the remaining balance is due before the event starts.

**Non-Goals:**
- Changing deposit percentage, cancellation, or any other terms.
- Changing actual payment enforcement logic (this is a copy-only fix; no payment collection code exists for the remaining balance today).

## Decisions

1. Replace "el día del evento" with "antes de comenzar el evento" in the `<li>` element in `Step3CustomerData.tsx` and in the equivalent line of the `terms` array in `src/lib/pdf.ts`. Plain text change, no i18n system in place for this copy.

## Note

- `src/pages/admin/reservations/[id]/contract.tsx` and `docs/contrato_alquiler_espacio.md` already state "antes del dia del evento o, a mas tardar, al inicio del mismo" for the formal rental contract clause 2.3 — these are already correct and out of scope for this change.

## Risks / Trade-offs

- None — isolated static text change.
