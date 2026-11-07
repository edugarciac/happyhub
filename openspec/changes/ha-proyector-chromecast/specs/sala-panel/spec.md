## ADDED Requirements

### Requirement: Projector status
The room panel SHALL show whether the projector's Chromecast "Proyector" is off, ready, showing the HappyHub background, or casting content.

#### Scenario: Projector off
- **WHEN** the Chromecast is unavailable
- **THEN** the panel SHALL show "Proyector apagado" and tell the customer to turn it on with the remote

#### Scenario: Customer casts
- **WHEN** a phone casts content to "Proyector"
- **THEN** the panel SHALL show "Proyectando" with the app or title

### Requirement: Default projector background
The customer SHALL be able to choose in the panel what the projector shows when nothing is being cast: HappyHub image, HappyHub video or the Chromecast background.

#### Scenario: Projector becomes free
- **WHEN** nothing has been cast for 10 seconds and the choice is a HappyHub background
- **THEN** the projector SHALL show that background

#### Scenario: Never interrupts the customer
- **WHEN** the customer is casting and changes the choice
- **THEN** the cast SHALL NOT be interrupted
