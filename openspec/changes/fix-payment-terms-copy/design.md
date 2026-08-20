## Context

`Step3CustomerData.tsx` renders a static terms and conditions list inside the booking flow. One bullet currently reads "El resto del pago se realizará el día del evento." which implies payment could be settled during/at the event itself, rather than beforehand.

## Goals / Non-Goals

**Goals:**
- Correct the copy to state the remaining balance is due before the event starts.

**Non-Goals:**
- Changing deposit percentage, cancellation, or any other terms.
- Changing actual payment enforcement logic (this is a copy-only fix; no payment collection code exists for the remaining balance today).

## Decisions

1. Replace "el día del evento" with "antes de comenzar el evento" in the single `<li>` element. Plain text change, no i18n system in place for this copy.

## Risks / Trade-offs

- None — isolated static text change.
