## ADDED Requirements

### Requirement: Organizer chooses a new or existing playlist per event
When enabling Música for an event, a Premium-connected organizer SHALL be able to choose between creating a new Spotify playlist for that event or selecting one of their existing playlists to use as the event's shared list.

#### Scenario: Create a new playlist
- **WHEN** an organizer with a Premium Spotify connection chooses "Crear playlist nueva" for an event
- **THEN** the system creates a new playlist on their Spotify account and links it to the event

#### Scenario: Use an existing playlist
- **WHEN** an organizer with a Premium Spotify connection chooses "Usar una playlist existente" and selects one of their playlists
- **THEN** the system links that playlist to the event without creating a new one

#### Scenario: Non-Premium organizer cannot set up Música
- **WHEN** an organizer whose connected Spotify account is not Premium attempts to set up Música for an event
- **THEN** the system blocks the setup and explains Premium is required, without offering the new/existing playlist choice

### Requirement: Song sync uses the organizer's linked connection
Approved song sync to the event's playlist SHALL use the access token from the organizer's linked `user_spotify_connections` row, refreshing it if expired.

#### Scenario: Sync with valid token
- **WHEN** an organizer syncs approved songs and their stored access token is still valid
- **THEN** the system pushes the approved songs to the event's linked playlist

#### Scenario: Sync with expired token
- **WHEN** an organizer syncs approved songs and their stored access token has expired
- **THEN** the system refreshes the token using the stored refresh token before syncing

## MODIFIED Requirements

### Requirement: Event Spotify connection references a user connection instead of storing tokens
The `event_spotify_connections` record for an event SHALL reference the organizer's `user_spotify_connections` row and the chosen playlist, and SHALL NOT store Spotify access or refresh tokens directly.

#### Scenario: Viewing an event's Música setup
- **WHEN** the system loads Música setup state for an event
- **THEN** it resolves the organizer's Spotify tokens via the linked `user_spotify_connections` row, not from any token columns on `event_spotify_connections`
