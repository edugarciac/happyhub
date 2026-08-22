# Tasks: invitados-ux-redesign

## T1 — Database
- [ ] Create migration adding `idx_participants_email` index
- [ ] Run migration against Neon DB

## T2 — Account linking
- [ ] Add `linkParticipantsToUser(userId, email)` to `src/utils/db/collaborative-events.ts`
- [ ] Call it from `POST /api/auth/register.ts` after user creation
- [ ] Call it from the NextAuth `signIn`/`jwt` callback in `src/lib/auth.ts`
- [ ] Make `email` required in `joinSchema` (`join/[inviteCode].ts`) and the join form UI

## T3 — Fix invite link
- [ ] Update `GuestList.tsx` invite URL to `/eventos/unirse/{inviteCode}`

## T4 — Invitados UI redesign
- [ ] RSVP stat cards
- [ ] Responsive guest list (card layout on mobile, table ≥ md)
- [ ] Empty state
- [ ] CTA hierarchy (primary "Añadir invitado", secondary Excel/link actions)
- [ ] "Cuenta vinculada" / "Solo RSVP" badge per guest row

## T5 — RSVP page CTA
- [ ] Add account-creation/login CTA to `invitacion/[token].tsx`
- [ ] Post-auth redirect to `/mis-eventos/{eventId}` when arriving via `eventInvite` param

## Verification
- [ ] Copy invite link from Invitados tab → opens the real join page (no 404)
- [ ] Join anonymously with email → register with same email → dashboard (incl. Música) opens without re-inviting
- [ ] Guest added by organizer (RSVP-token flow) → later registers with same email → gets linked and can open the dashboard
- [ ] Existing linked guest logging in again → no duplicate rows, no errors
- [ ] Invitados tab renders correctly on mobile and desktop, empty and populated states
