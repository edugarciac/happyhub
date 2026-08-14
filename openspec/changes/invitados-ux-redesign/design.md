## Context

`GuestList.tsx` (254 lines) renders RSVP stat badges, a copyable invite link, organizer-only "+ Añadir uno" / "📊 Importar Excel" actions, and a guest table. It has no loading/empty states beyond a basic list and no visual distinction between guest types.

Three separate mechanisms currently manage guest access, none of them unified:

1. **Organizer-added guest** (`POST /api/events/collaborative/[id]/guests`) generates an `invite_token` and emails a link to `/invitacion/[token].tsx` — a public, layout-less RSVP form (`GET/POST /api/rsvp/[token]`). It only sets RSVP status/note; it is a dead end with no path to the dashboard.
2. **Self-join via invite code** (`/eventos/unirse/[inviteCode].tsx` → `POST /api/events/collaborative/join/[inviteCode].ts`) works with or without a session. Anonymous joins create a participant row with `user_id = NULL`.
3. **Dashboard gate** (`/mis-eventos/[id].tsx`, `getServerSideProps` lines 31-70) requires a NextAuth session *and* a `collaborative_event_participants` row matched by `user_id` (or organizer). Anonymous participants from (2) can never pass this check, and nothing links them to an account created afterward.

`collaborative_event_participants` already has `user_id` (nullable), `name`, `email` (nullable), `role`, `rsvp_status`, plus `invite_token`/`invited_at`/`rsvp_note` from migration 012. No schema change is needed to link by email — the column already exists.

## Goals / Non-Goals

**Goals:**
- Every guest-facing entry point (RSVP link, join link) leads somewhere that either grants dashboard access or clearly explains how to get it.
- An anonymous or RSVP-only guest who later creates a HappyHub account with the same email is automatically recognized as the same participant — no manual re-invite, no duplicate rows.
- Visual redesign of the Invitados tab: scannable at a glance, usable on mobile, clear primary action.

**Non-Goals:**
- A no-account (token-based) access model for Música/Actividades — out of scope per product decision; guests must have an account to reach collaborative sections.
- Real-time updates to the guest list (still request/response on mount, consistent with the rest of the dashboard).
- Merging two *different* participant rows for the same person across *different* events — linking is scoped per email within a single event's participant set (a user can be a guest of many events; each event's row links independently).

## Decisions

### 1. Link by exact email match, at register time and at every login

**Decision**: Add `linkParticipantsToUser(userId, email)` in `src/utils/db/collaborative-events.ts`:
```sql
UPDATE collaborative_event_participants
SET user_id = $1
WHERE user_id IS NULL AND lower(email) = lower($2)
```
Call it from `POST /api/auth/register.ts` right after `createUser`, and from the NextAuth `session`/`signIn` callback in `src/lib/auth.ts` on every successful login (idempotent — a no-op once already linked).

**Rationale**: Covers both orderings — a guest who registers right after joining anonymously, and a guest who already had an account before someone added them by email (organizer-added guest row created with `user_id = NULL` because the email didn't match an existing session at invite time). Running it on every login (not just registration) catches that second case without extra plumbing.

**Alternatives considered**: Linking only at registration — rejected, misses the "already had an account, added as guest later" case, which is the more common one for repeat HappyHub users.

### 2. Anonymous join requires email

**Decision**: Make `email` required (not `.optional()`) in `joinSchema` (`join/[inviteCode].ts`) and in the join form UI.

**Rationale**: Auto-linking is impossible without an email to match against. The join form already asks for a name; adding a required email field is a small UX cost for guests, in exchange for actually being able to reach the dashboard later instead of being permanently stuck as an anonymous row.

### 3. Fix the invite link at the source, don't add a redirect route

**Decision**: Change `GuestList.tsx:39-40` to build `/eventos/unirse/${inviteCode}` directly, matching the existing route. No new `/unirse/[code]` short-path route is introduced.

**Rationale**: Simplest fix with zero new surface area. A shorter marketing-friendly URL is a separate concern not requested here.

### 4. RSVP-only page gets a CTA, not a merge into the join flow

**Decision**: `/invitacion/[token].tsx` keeps working exactly as today (RSVP set via `invite_token`), and gains a footer CTA: "¿Quieres ver el evento, la lista de música y más? Crea tu cuenta o inicia sesión" linking to `/register` (or `/login`) with a `redirect` query param back to a join-and-link flow for that event.

**Rationale**: The RSVP token flow and the account/dashboard flow serve different moments (a quick RSVP vs. actually participating). Keeping the RSVP page focused avoids regressing its low-friction purpose while still offering the on-ramp to the fuller experience.

### 5. "Cuenta vinculada" indicator is derived, not stored

**Decision**: In the organizer's guest table, show a badge computed from `participant.user_id != null` — no new column.

**Rationale**: The data already answers the question; no denormalization needed.

## Risks / Trade-offs

- **Email collisions**: if two different people share an email (rare, e.g. a shared family inbox), linking could attach the wrong participant row to an account. Accepted as a low-probability edge case consistent with how email is used as the identifier everywhere else in the app (registration, RSVP).
- **Login-time linking cost**: an extra `UPDATE ... WHERE` on every login is cheap (indexed lookup, typically 0 rows affected) but is a new query on the hot auth path — mitigated by the new index in Impact.
- **Making email required on anonymous join** is a small breaking change to the join API contract; low risk since the flow isn't documented externally and the UI form is updated in the same change.
