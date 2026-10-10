## MODIFIED Requirements

### Requirement: Bookings only from the day after opening
The booking calendar SHALL mark dates before 2026-10-17 (including the opening day, 2026-10-16) as unavailable, and the reservation API SHALL reject them.

#### Scenario: Customer tries the opening day
- **WHEN** a customer views the calendar
- **THEN** 16 October SHALL appear unavailable and 17 October SHALL be bookable

### Requirement: Admin-blocked slots cannot be booked
`POST /api/webhook-reserva` SHALL NOT create a reservation for a date and slot present in `blocked_slots`, and SHALL respond 409.
