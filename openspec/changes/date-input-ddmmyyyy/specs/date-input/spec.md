## ADDED Requirements

### Requirement: Date fields always display dd/mm/aaaa
All date entry fields SHALL display dates as dd/mm/aaaa regardless of the device locale, while storing them as YYYY-MM-DD.

#### Scenario: Device with US region
- **WHEN** a user with an en-US browser opens a form with a date field set to 2026-10-17
- **THEN** the field SHALL show 17/10/2026

#### Scenario: Typing a date
- **WHEN** the user types 20102026
- **THEN** the field SHALL show 20/10/2026 and the form value SHALL be 2026-10-20

#### Scenario: Invalid or out-of-range date
- **WHEN** the user types an impossible date (31/02/2027) or one before `min`
- **THEN** the field SHALL show "Fecha no válida" and the form value SHALL be empty
