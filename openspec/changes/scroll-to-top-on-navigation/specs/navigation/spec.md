## ADDED Requirements

### Requirement: New views start at the top
Navigating to a new page or a new booking step SHALL show it from the top.

#### Scenario: Footer link from the bottom of a page
- **WHEN** a user at the bottom of the homepage clicks a footer link
- **THEN** the new page SHALL be shown with scroll position 0

#### Scenario: Next booking step
- **WHEN** the user clicks "Continuar" at the bottom of a booking step
- **THEN** the next step SHALL be shown from the top
