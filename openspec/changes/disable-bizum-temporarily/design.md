## Decision
A single boolean `BIZUM_ENABLED` in `src/config/payments.ts`. Re-enabling = set it to `true` and deploy. A code constant (not an env var) keeps it reviewable in git and matches how the other payment settings live there.

`PAYMENT_METHODS` stays `['card', 'bizum']` so existing rows and types keep validating; a new `AVAILABLE_PAYMENT_METHODS` list drives what new bookings may choose.

## Existing Bizum reservations
Pending reservations that picked Bizum get card-only instructions on the pay page and in reminder emails. Bizum transfers that already arrived are confirmed by the admin as today.
