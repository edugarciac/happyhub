## Why

Invitados (`GuestList.tsx`) is the tab most organizers open first in Mis Eventos, but it's a bare RSVP table with no visual hierarchy — hard to scan, no empty state, cramped on mobile. Two structural bugs compound it:

- The copyable "Enlace de invitación general" is built as `/unirse/{inviteCode}` (`GuestList.tsx:39-40`), but the real join page lives at `/eventos/unirse/[inviteCode]` — the link organizers share 404s.
- Guests who join through that link anonymously (`user_id = NULL`) or who only opened their personal RSVP link (`/invitacion/[token]`) can never open `/mis-eventos/[id]` afterwards: `getServerSideProps` there requires a session matched to a `collaborative_event_participants.user_id`. They're structurally blocked from every collaborative tab — Música included — even after they eventually register, because nothing links their pre-existing participant row to the account they create.

This redesigns the Invitados UI and closes the account-linking gap so every guest path leads somewhere usable, which is also a prerequisite for the Música change (guests can't suggest songs on a dashboard they can't open).

## What Changes

- Redesign `GuestList.tsx`: RSVP summary as stat cards, a clearer list/card layout for guests (mobile-friendly), a real empty state, clearer primary/secondary CTAs for "Añadir invitado", "Importar Excel", and "Copiar enlace"
- Fix the invite link to point at the real route (`/eventos/unirse/{inviteCode}`)
- Add a "Crear cuenta / Iniciar sesión" CTA to the RSVP-only page (`/invitacion/[token].tsx`) so guests who only received an RSVP link have a path into a real account and the dashboard
- Require an email on the anonymous join form (`/eventos/unirse/[inviteCode].tsx`) — currently optional in `joinSchema` — so every participant row has an email to match against
- On registration and on login, auto-link any pre-existing `collaborative_event_participants` row(s) with `user_id IS NULL AND email = <account email>` to the authenticated `user_id`, so a guest who joined anonymously before creating an account gets seamless dashboard access afterward instead of being stuck or silently duplicated
- Add a lightweight "cuenta vinculada" vs "solo RSVP" indicator to the organizer's guest table, so organizers understand who can actually reach the dashboard (and by extension, contribute to Música/Actividades)

## Capabilities

### New Capabilities
- `guest-account-auto-linking`: matches anonymous/RSVP-only participant rows to a user account by email on register/login, granting dashboard access retroactively
- `guest-list-redesigned-ui`: visual/UX overhaul of the Invitados tab (stat cards, responsive list, empty state, CTAs)

### Modified Capabilities
- `collaborative-event-join-link`: corrected invite URL in `GuestList.tsx`
- `rsvp-only-guest-page`: adds an account-creation CTA instead of being a dead end
- `collaborative-event-join`: email becomes required for anonymous joins

## Impact

- **Frontend**: `src/components/events/GuestList.tsx` (redesign + link fix), `src/pages/invitacion/[token].tsx` (CTA), `src/pages/eventos/unirse/[inviteCode].tsx` (required email field)
- **Backend**: `src/pages/api/auth/register.ts` and the credentials/Google sign-in path (`src/lib/auth.ts`) — both call a new shared linking helper; `src/pages/api/events/collaborative/join/[inviteCode].ts` (email required)
- **Database**: no new tables; add an index on `collaborative_event_participants(email)` if none exists, since linking now queries by email on every register/login
- **No change** to `event_spotify_connections` or `event_activities` data models — this only unblocks the *access path* the Música and Actividades changes depend on
