## ADDED Requirements

### Requirement: Users connect their own Spotify account at the profile level
The system SHALL let a logged-in user connect their personal Spotify account once, from their profile/account area, reusable across every event they organize.

#### Scenario: First-time connect
- **WHEN** a user with no existing Spotify connection completes the Spotify OAuth flow from their profile
- **THEN** the system stores a `user_spotify_connections` row for that user with their Spotify tokens and profile info

#### Scenario: Reconnect updates the existing connection
- **WHEN** a user who already has a Spotify connection completes the OAuth flow again
- **THEN** the system updates the existing connection's tokens rather than creating a duplicate

### Requirement: System verifies Spotify Premium status
The system SHALL check the connected Spotify account's subscription tier via the Spotify API and record it, gating playlist setup on it being Premium.

#### Scenario: Premium account connects
- **WHEN** a user connects a Spotify account with `product: "premium"`
- **THEN** the system stores `product = 'premium'` and allows the user to set up Música for their events

#### Scenario: Free account connects
- **WHEN** a user connects a Spotify account with `product: "free"`
- **THEN** the system stores `product = 'free'` and blocks Música setup with a message explaining Premium is required

### Requirement: Users can disconnect their Spotify account
The system SHALL let a user remove their Spotify connection, detaching it from any events that referenced it.

#### Scenario: Disconnect
- **WHEN** a user disconnects their Spotify account from their profile
- **THEN** the system deletes their `user_spotify_connections` row and clears `user_connection_id` on every event that referenced it, without deleting past synced playlist data on Spotify's side
