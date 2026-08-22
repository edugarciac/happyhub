# Tasks: musica-user-spotify-connection

## T1 — Database
- [ ] Create `user_spotify_connections` table migration
- [ ] Alter `event_spotify_connections`: drop token columns, add `user_connection_id`, `is_new_playlist`
- [ ] Run migrations against Neon DB
- [ ] Write and run one-off backfill script for existing `event_spotify_connections` rows (see design.md "Migration path")

## T2 — Shared Spotify helper
- [ ] `src/lib/spotify.ts`: `getValidAccessToken(userConnectionId)` with refresh-on-expiry

## T3 — Profile-level OAuth
- [ ] `GET /api/account/spotify/connect` (state = userId only)
- [ ] Rewrite `GET /api/auth/spotify/callback.ts` for user-level state + `/v1/me` product check + upsert
- [ ] `POST /api/account/spotify/disconnect`
- [ ] `GET /api/account/spotify/playlists`
- [ ] Add Spotify section to profile/account UI (connect button, Premium/display-name status, disconnect)

## T4 — Event-level playlist setup
- [ ] `GET /api/events/collaborative/[id]/entertainment/spotify/connection` (status endpoint)
- [ ] `PUT /api/events/collaborative/[id]/entertainment/spotify/connection` (new/existing playlist)
- [ ] Remove old `connect.ts` OAuth-redirect behavior (superseded)
- [ ] Update `songs.ts` / `sync.ts` to use `getValidAccessToken` via `user_connection_id`

## T5 — Frontend: SpotifyPlaylistTab states
- [x] `not_connected` state
- [x] ~~`not_premium` state~~ (removed, see T7)
- [x] `needs_playlist_choice` state (new/existing picker)
- [x] `ready` state header addition (playlist name/link, connected-as)

## T6 — Cleanup
- [x] Delete `EntertainmentSection.tsx` (unused)

## T7 — Remove Premium gate (2026-08-14)
- [x] `connection.ts` GET/PUT: drop `product !== 'premium'` checks
- [x] `playlists.ts`: drop the same check
- [x] `SpotifyPlaylistTab.tsx`: remove `not_premium` status/branch
- [x] `SpotifyConnectionCard.tsx`: remove Premium-gated messaging, update connect copy

## Verification
- [ ] Connect Spotify from profile (any account, Premium or Free) → status shows connected, playlist setup available either way
- [ ] Enable Música for an event → choose "new playlist" → playlist created on Spotify, songs sync
- [ ] Enable Música for a second event with the same connection → choose "existing playlist" → correct playlist linked, no re-auth required
- [ ] Disconnect from profile → both events show `not_connected` again, past synced songs unaffected on Spotify's side
- [ ] Participant suggest/approve/sync flow works unchanged end-to-end
- [ ] Backfill script tested against a copy of current `event_spotify_connections` data (or staging) before running on production
