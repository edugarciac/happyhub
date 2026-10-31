## ADDED Requirements

### Requirement: Activation button with startup feedback
The room panel SHALL show a single button labelled "Activar SALA" when the room is off and "Desactivar SALA" when it is on, and SHALL replace it with a "the sound will take a few seconds" notice while the room is starting.

#### Scenario: Customer activates the room
- **WHEN** the customer taps "Activar SALA"
- **THEN** the panel SHALL show "Activando la sala… el sonido tardará unos segundos" until the amplifier is available or 60 s pass
- **AND** then show "Desactivar SALA"

#### Scenario: Partial state
- **WHEN** the amplifier or subwoofer is off but the other is on
- **THEN** the panel SHALL show both "Activar SALA" and "Desactivar SALA" and a warning that the sound is incomplete

### Requirement: Sound equipment status
The panel SHALL show, read-only, whether the amplifier and the subwoofer are on.

#### Scenario: Equipment on
- **WHEN** both are on and the player is available
- **THEN** the panel SHALL show "Sonido listo"

### Requirement: Connection information
The panel SHALL show the music source (Bluetooth, Gramola/WiFi, Spotify, AirPlay, cable), and when available the app, song, artist, playback state and volume.

#### Scenario: Phone by Bluetooth
- **WHEN** a phone plays music by Bluetooth
- **THEN** the panel SHALL show "Móvil por Bluetooth" with the song and volume
