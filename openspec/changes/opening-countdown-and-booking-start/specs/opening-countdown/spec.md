## ADDED Requirements

### Requirement: Opening countdown on entry
The site SHALL show, on entry, the opening date (16 de octubre) and the number of days remaining, recalculated daily in Europe/Madrid time.

#### Scenario: Visitor arrives before opening
- **WHEN** a visitor opens the site on 2026-10-10
- **THEN** the popup and the homepage Hero SHALL show "16 de octubre" and 6 days remaining

#### Scenario: Opening day
- **WHEN** a visitor opens the site on 2026-10-16
- **THEN** the countdown SHALL show "¡Hoy inauguramos!" instead of a number

#### Scenario: After opening
- **WHEN** a visitor opens the site on or after 2026-10-17
- **THEN** neither the popup nor the Hero countdown SHALL be shown
