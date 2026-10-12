## MODIFIED Requirements

### Requirement: Opening and booking start dates
The venue opening day SHALL be 2026-10-18 and online bookings SHALL be accepted for event dates from 2026-10-19.

#### Scenario: Countdown and banners
- **WHEN** a visitor sees the opening countdown or coming-soon overlay
- **THEN** it SHALL show "18 de octubre" as opening and "19 de octubre" as booking start

#### Scenario: Booking on the opening day
- **WHEN** a user tries to book 2026-10-18 or earlier
- **THEN** the calendar SHALL not allow it and the API SHALL reject it
