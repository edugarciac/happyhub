## ADDED Requirements

### Requirement: Logo face matches official design
All deployed HappyHub logo assets in `public/` that render the bubble face SHALL show a winking expression (right eye closed as an upward-curving arc, left eye open) and a sparkle star with a turquoise outline, white fill, and two turquoise dots, matching the official reference design (`HAPPY HUB DISEÑO.pdf`).

#### Scenario: Header logo
- **WHEN** any page of the site loads
- **THEN** the logo rendered in the header (`happyhub_logo_cara.png`) SHALL show the winking face with the right eye closed

#### Scenario: Footer logo
- **WHEN** the footer is visible
- **THEN** the logo rendered there (`happyhub_logo_white.png`) SHALL show the winking face with an outlined star and two turquoise dots
