## ADDED Requirements

### Requirement: Customer can book extra afternoon hours
The booking wizard SHALL let the customer add 0 to 3 extra hours (20:00–23:00h) to an afternoon booking, at 60 € per hour, and SHALL include their cost in the total and the 30% deposit.

#### Scenario: Customer adds extra hours
- **WHEN** a customer booking the afternoon slot selects 2 extra hours
- **THEN** the summary SHALL show "Horas adicionales (2 × 60 €)" = 120 €, the end time 22:00h, and a total that includes the 120 €

#### Scenario: Morning slot
- **WHEN** the selected slot is morning or the price is "A consultar"
- **THEN** the extra hours selector SHALL NOT be shown and extra hours SHALL be 0

### Requirement: Extra hours are stored and propagated
The system SHALL store the extra hours with the reservation and reflect them in the calendar event, confirmation emails and admin list.

#### Scenario: Reservation with extra hours is created
- **WHEN** a reservation with 2 extra hours is submitted
- **THEN** `reservations.extra_hours` SHALL be 2, the calendar event SHALL end at 22:00 and the emails SHALL show the extended schedule and the extra hours cost

#### Scenario: Invalid extra hours
- **WHEN** the request has extra hours outside 0–3 or extra hours on a non-afternoon slot
- **THEN** the API SHALL respond 400 and not create the reservation
