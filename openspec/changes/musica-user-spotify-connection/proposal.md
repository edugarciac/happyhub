## Why

Música already works (`SpotifyPlaylistTab.tsx`): participants search tracks (via app-level Spotify Client Credentials, no personal login needed) and suggest songs, the organizer approves/rejects, and approved songs sync to a playlist. But the Spotify OAuth connection behind it is entirely **event-scoped**: `event_spotify_connections` has `UNIQUE(event_id)` and stores the tokens of whoever authorized it for that one event (`connect.ts`, `callback.ts`), so the organizer has to reconnect Spotify separately for every event, there's no concept of "my Spotify account" on a user's profile, and nothing checks whether the connecting account is actually Premium.

The product intent is different: the playlist should be driven by **the logged-in user's own Spotify Premium account** — connected once, reusable across every event they organize — and when enabling Música for an event, they choose to either create a fresh playlist or point at one of their existing Spotify playlists as "the" shared list for that event. Guests then contribute songs into that single chosen list, same as today.

## What Changes

- New profile-level Spotify connection: connect once from the account/profile area, reused across all of the user's events (replaces the current "reconnect per event" model)
- On connect, call Spotify's `GET /v1/me` and store `product` (`premium`/`free`); block enabling Música for an event if the connected account isn't Premium
- When a user (with a Premium connection) sets up Música for one of their events, they choose: **create a new playlist** for this event, or **pick one of their existing Spotify playlists** (`GET /v1/me/playlists`) to use as the event's shared list
- `event_spotify_connections` stops storing tokens; it becomes a pointer from `event_id` to the organizer's `user_spotify_connections` row plus the chosen `playlist_id`/`playlist_url`/`is_new_playlist` for that event
- Song suggestion, approval, and sync logic (`songs.ts`, `sync.ts`) unchanged in behavior — they now read the access token via the linked `user_spotify_connections` row instead of a per-event token
- Add a disconnect action (profile-level) that also detaches any events currently pointing at that connection, with a clear warning
- Remove the orphaned `EntertainmentSection.tsx` (never imported — `mis-eventos/[id].tsx` renders `SpotifyPlaylistTab`/`ActivitiesTab` directly already) as a cleanup, since it's dead code adjacent to this area

## Capabilities

### New Capabilities
- `user-level-spotify-connection`: profile-scoped Spotify OAuth, one connection per user, reusable across events
- `spotify-premium-verification`: checks `product: "premium"` via Spotify API and gates Música setup on it
- `event-playlist-selection`: choice between a new playlist or an existing one when enabling Música for an event

### Modified Capabilities
- `event-spotify-connection`: becomes a reference (user connection + chosen playlist) instead of holding tokens directly
- `spotify-song-sync`: reads tokens via the linked user connection

### Removed
- Per-event Spotify OAuth connect/callback flow (superseded by the profile-level flow)
- `EntertainmentSection.tsx` (dead code)

## Impact

- **Database**: new `user_spotify_connections` table (`UNIQUE(user_id)`, holds tokens + `spotify_user_id`, `display_name`, `product`); migration alters `event_spotify_connections` to drop token columns and add `user_connection_id` FK + `is_new_playlist`
- **API routes**: new `GET /api/account/spotify/connect`, `GET /api/auth/spotify/callback` (rewritten for user-level state), `POST /api/account/spotify/disconnect`, `GET /api/account/spotify/playlists`; modify `src/pages/api/events/collaborative/[id]/entertainment/spotify/connect.ts` → becomes a "link existing connection + choose playlist" endpoint rather than an OAuth redirect; `songs.ts`/`sync.ts` read tokens via the join
- **Frontend**: new Spotify section in the account/profile area (`/area-privada` or a new `/mi-cuenta` page — confirm placement at implementation time against current profile page structure); `SpotifyPlaylistTab.tsx` gains a setup step (connect-prompt if not connected, Premium-required message if not Premium, new/existing playlist picker if connected)
- **Cleanup**: delete `EntertainmentSection.tsx`
