## ADDED Requirements

### Requirement: Room button with startup feedback
The room panel SHALL show "Sala ON" when the room is off and "Sala OFF" when it is on, and SHALL replace them with a non-tappable "the sound will take a few seconds" notice while the room is starting.

#### Scenario: Customer turns the room on
- **WHEN** the customer taps "Sala ON"
- **THEN** the panel SHALL show "Encendiendo sala… El sonido tardará unos segundos" until the amplifier is available or 60 s pass
- **AND** then show "Sala OFF"

#### Scenario: Partial state
- **WHEN** only some of the main light, amplifier and subwoofer are on
- **THEN** the panel SHALL show both "Sala ON" and "Sala OFF"

### Requirement: Music ON button
The panel SHALL offer a "Música ON" button that turns on only the amplifier and the subwoofer, and SHALL ignore repeated taps while it is starting.

#### Scenario: Repeated taps
- **WHEN** the customer taps "Música ON" several times in a row
- **THEN** the sound SHALL start only once
- **AND** the button SHALL be replaced by "Encendiendo música…" until the sound is ready

#### Scenario: Sound ready
- **WHEN** the amplifier and subwoofer are on and the player is available
- **THEN** the panel SHALL show "Sonido listo" instead of the button

### Requirement: Sound equipment status
The panel SHALL show, read-only, whether the amplifier and the subwoofer are on.

### Requirement: Connection information
The panel SHALL show the music source (Bluetooth, Gramola/WiFi, Spotify, AirPlay, cable), and when available the app, song, artist, playback state and volume, keeping the "Listo para conectar" and "Móvil conectado" texts for Bluetooth.

#### Scenario: Phone by Bluetooth
- **WHEN** a phone plays music by Bluetooth
- **THEN** the panel SHALL show "Móvil conectado" with the song and volume
