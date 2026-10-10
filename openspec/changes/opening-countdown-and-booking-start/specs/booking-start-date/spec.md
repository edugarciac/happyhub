## ADDED Requirements

### Requirement: Bookings only from opening date
The booking calendar SHALL mark dates before 2026-10-16 as unavailable, and the reservation API SHALL reject them.

#### Scenario: Customer tries a date before opening
- **WHEN** a customer views the calendar
- **THEN** dates before 16 October SHALL appear unavailable and cannot be selected

#### Scenario: Direct API request with an early date
- **WHEN** `POST /api/webhook-reserva` receives a date before 2026-10-16
- **THEN** it SHALL respond 400 with "Solo aceptamos reservas a partir del 16 de octubre"
