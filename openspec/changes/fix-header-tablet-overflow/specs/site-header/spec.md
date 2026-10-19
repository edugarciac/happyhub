## MODIFIED Requirements

### Requirement: Header fits the viewport
The site header SHALL never overflow horizontally; the "Solicitar Reserva" button SHALL be fully visible at every viewport width.

#### Scenario: Tablet in landscape
- **WHEN** the viewport is narrower than 1280px (e.g. iPad landscape)
- **THEN** the header SHALL show the hamburger menu instead of the desktop navigation

#### Scenario: Logged-in user on desktop
- **WHEN** a logged-in user views the header at 1280px or wider
- **THEN** the account SHALL be shown as a compact avatar with the email in its tooltip, and the header SHALL not overflow
