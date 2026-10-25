## ADDED Requirements

### Requirement: Spotify behind a feature flag
The Spotify integration SHALL be controlled by `SPOTIFY_ENABLED` in `src/config/features.ts`. When it is `false`, no Spotify entry point SHALL be shown or usable.

#### Scenario: Private area with Spotify disabled
- **WHEN** a user opens `/area-privada` with `SPOTIFY_ENABLED = false`
- **THEN** the Spotify connection card SHALL not be shown

#### Scenario: Event dashboard with Spotify disabled
- **WHEN** a user opens an event in `/mis-eventos/[id]` with `SPOTIFY_ENABLED = false`
- **THEN** the "Música" tab SHALL not appear in the sidebar or the mobile bar
- **AND** `?section=musica` SHALL show the default section

#### Scenario: Connect endpoint with Spotify disabled
- **WHEN** `GET /api/account/spotify/connect` is called with `SPOTIFY_ENABLED = false`
- **THEN** the API SHALL respond 404 and SHALL NOT redirect to Spotify

#### Scenario: Re-enabling
- **WHEN** `SPOTIFY_ENABLED` is set to `true`
- **THEN** the card, the tab and the connect flow SHALL work as before
