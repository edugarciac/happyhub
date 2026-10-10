## MODIFIED Requirements

### Requirement: Bookable time slots
The system SHALL only offer and accept the morning (10:00–14:00) and afternoon (16:00–20:00) time slots for new bookings.

#### Scenario: Customer views the calendar
- **WHEN** a customer opens `/disponibilidad` or `/reservas`
- **THEN** each day SHALL show only the M and T slots, and no night slot or night text

#### Scenario: Direct API request for night
- **WHEN** `POST /api/webhook-reserva` receives `timeSlot: "night"`
- **THEN** it SHALL respond 400 and not create a reservation

#### Scenario: Legacy night reservation
- **WHEN** an existing reservation has `time_slot = 'night'`
- **THEN** invoices, PDFs, notifications and admin lists SHALL still display it as "Noche"
