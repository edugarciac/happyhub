## 1. Implementation

- [x] 1.1 `src/config/features.ts` with `SPOTIFY_ENABLED = false`
- [x] 1.2 Hide `SpotifyConnectionCard` in `/area-privada`
- [x] 1.3 Hide the `musica` tab in `EventSidebar`; fall back to the default section in `/mis-eventos/[id]`
- [x] 1.4 `/api/account/spotify/connect` returns 404 when disabled

## 2. Verify

- [x] 2.1 `npx tsc --noEmit`, `npm test`
- [ ] 2.2 Check `/area-privada` and an event dashboard in production
