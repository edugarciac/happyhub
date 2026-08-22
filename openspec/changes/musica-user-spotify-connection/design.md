## Context

Today's flow (fully implemented, `database/migrations/014_entertainment_section.sql`):
- `event_spotify_connections(event_id UNIQUE, user_id, access_token, refresh_token, token_expires_at, playlist_id, playlist_url)` — one OAuth grant per event.
- `GET .../entertainment/spotify/connect` (`connect.ts`): organizer-only, redirects to Spotify OAuth with `state = eventId:userId:hmac(eventId:userId)`, scopes `playlist-modify-public playlist-modify-private`.
- `GET /api/auth/spotify/callback.ts`: verifies the HMAC, exchanges the code, `INSERT ... ON CONFLICT (event_id) DO UPDATE` into `event_spotify_connections`.
- `GET /api/entertainment/spotify/search.ts`: track search uses **app-level Client Credentials** (separate from the organizer's OAuth), so any participant can search without needing their own Spotify login — this part is unaffected by this change.
- `POST .../entertainment/spotify/sync.ts`: pushes approved `event_entertainment_songs` into the connected playlist using the event's stored token.
- `event_entertainment_songs(event_id, title, artist, spotify_track_id/uri, suggested_by_participant_id, status)` — participant suggestions, organizer approves/rejects. Unaffected by this change.

No `premium`/`subscription` concept exists anywhere in the schema. NextAuth uses JWT strategy with no database adapter, so there's no generic OAuth-account-linking table to hang a Spotify identity off of — a bespoke `user_spotify_connections` table is the right shape, mirroring how `event_spotify_connections` already works today, just re-keyed to `user_id`.

## Goals / Non-Goals

**Goals:**
- One Spotify connection per HappyHub user, reusable across every event they organize.
- Record subscription tier via Spotify's own API (`GET /v1/me` → `product` field) for informational purposes.
- Let the connected user choose a brand-new playlist or an existing one, per event.
- Preserve the existing suggest → approve/reject → sync UX for participants unchanged.

**Reversed decision (2026-08-14):** the original goal here was "gate the feature on Premium," per the initial product ask. That gate has been removed — Spotify's Web API doesn't actually require Premium for playlist creation/modification (Premium is only required for things like the Web Playback SDK), so the Premium check was a business rule layered on top of no real technical need, and it was blocking real usage (the person testing the feature didn't have Premium themselves). `product` is still fetched and stored, but purely informational now — nothing in the app reads it to block anything.

**Non-Goals:**
- Per-participant Spotify logins (search stays on Client Credentials — no change).
- Multiple Spotify connections per user (one active connection at a time, consistent with "your account").
- Automatically re-syncing playlist metadata (name/cover) from Spotify back into HappyHub — out of scope.
- Handling Premium status *changes* after connection (e.g. user cancels Premium later) beyond a best-effort re-check on next connect/settings view — no background job.

## Decisions

### 1. New `user_spotify_connections` table, `event_spotify_connections` becomes a pointer

**Decision**:
```sql
CREATE TABLE user_spotify_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  spotify_user_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(255),
  product VARCHAR(20) NOT NULL, -- 'premium' | 'free'
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE event_spotify_connections
  DROP COLUMN access_token,
  DROP COLUMN refresh_token,
  DROP COLUMN token_expires_at,
  ADD COLUMN user_connection_id INTEGER REFERENCES user_spotify_connections(id) ON DELETE SET NULL,
  ADD COLUMN is_new_playlist BOOLEAN DEFAULT TRUE;
```
`event_spotify_connections` keeps its `UNIQUE(event_id)` and `playlist_id`/`playlist_url` — it now records *which* playlist was chosen for *which* event, not credentials.

**Rationale**: Tokens live in exactly one place (easier refresh/rotation), and the same connection can back multiple events without re-authorizing. Keeping `event_spotify_connections` (rather than dropping it) preserves the existing per-event playlist link and the song-sync code's event-scoped lookups, minimizing churn in `songs.ts`/`sync.ts`.

**Alternatives considered**: Dropping `event_spotify_connections` entirely and adding `playlist_id`/`user_connection_id` directly onto `collaborative_events` — rejected, mixes an entertainment-specific concern into the core event table and loses the natural `is_new_playlist` per-event flag.

### 2. OAuth state carries only `userId`, connection happens on the profile page

**Decision**: `state = userId:hmac(userId)`, same HMAC-over-`NEXTAUTH_SECRET` pattern as today. Redirect target after callback: back to the profile Spotify section, not an event page.

**Rationale**: Minimal change to the existing, already-correct HMAC anti-CSRF pattern — just drop `eventId` from the signed payload since the connection is no longer event-specific.

### 3. `product` recorded at connect time, not enforced (reversed)

**Decision**: In the callback, after exchanging the code, call `GET https://api.spotify.com/v1/me` and store `product`. ~~Música setup (choosing a playlist for an event) reads the cached `product`~~ — **removed**: Música setup no longer checks `product` at all; any connected account can proceed straight to the new/existing playlist choice.

**Rationale**: Spotify's Web API doesn't require Premium for playlist-modify scopes — the original gate was a business rule, not a technical constraint, and it was blocking real usage. `product` is kept in storage as informational metadata only.

### 4. New-vs-existing playlist choice is a one-time, per-event setup step

**Decision**: The first time a user opens Música for an event with no `event_spotify_connections` row yet:
- If not connected → "Conecta tu cuenta Premium de Spotify" (links to profile connect flow).
- If connected but `product !== 'premium'` → blocking message, no further action offered.
- If connected and Premium → radio choice: "Crear una playlist nueva para este evento" vs. "Usar una de mis playlists existentes" (fetches `GET /v1/me/playlists`, paginated list to pick from). Selecting either creates the `event_spotify_connections` row (`is_new_playlist` set accordingly; a new Spotify playlist is created via `POST /v1/me/playlists` only in the "new" branch).

**Rationale**: Matches the request directly ("share a new or existing list") and keeps the choice scoped to event setup rather than a separate settings screen, consistent with how the rest of Música setup already lives inside `SpotifyPlaylistTab.tsx`.

### 5. `EntertainmentSection.tsx` removed, not repurposed

**Decision**: Delete the file; it has zero imports today (`mis-eventos/[id].tsx` already renders `SpotifyPlaylistTab` and `ActivitiesTab` directly per the sidebar's two independent tabs).

**Rationale**: Dead code in the exact area being touched — removing it now avoids leaving a stale, easily-confused duplicate.

## Migration path

Any existing `event_spotify_connections` rows (organizer-connected under the old per-event model) need one-time backfill: for each, create a `user_spotify_connections` row from its stored tokens (best-effort Premium check against Spotify at migration time — if it fails, mark `product = 'free'` conservatively and let the user reconnect), then point the event row at it via `user_connection_id` and drop the token columns. Written as a one-off data migration script run manually against Neon (not a `next()`-time migration), since it needs live Spotify API calls per row.

## Risks / Trade-offs

- **Token refresh ownership**: with one connection reused across many events, a refresh-token failure (e.g. user revoked access from Spotify's side) now affects every event at once rather than just one. Mitigated by surfacing a clear "reconectar Spotify" state per event rather than failing silently.
- **Premium enforcement is Spotify's word, not verified per-request**: a user could downgrade after connecting and keep using a stale "premium" flag until they reconnect. Accepted — matches the Non-Goals decision not to run a background re-check job.
- **Backfill script touches live tokens**: must run once, carefully, with logging; existing connected events lose Música access if the backfill or reconnect isn't completed (acceptable for a small number of live events at this stage of the product).
