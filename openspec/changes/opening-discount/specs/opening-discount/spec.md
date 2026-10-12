## ADDED Requirements

### Requirement: Opening early-booking discount
The system SHALL apply a 10% discount on the space rental price (excluding extras) to reservation requests submitted on or before 2026-10-18 (Europe/Madrid) for events dated on or before 2026-12-30.

#### Scenario: Eligible request
- **WHEN** a user submits a request on 2026-10-15 for a Tuesday afternoon on 2026-11-10 (130 €) with no extras
- **THEN** the summary SHALL show a discount of 13 € and a total of 117 €
- **AND** the deposit SHALL be 36 € (30% rounded up)

#### Scenario: Extras are not discounted
- **WHEN** an eligible request includes extras
- **THEN** the discount SHALL be computed only on the rental price

#### Scenario: Event after the promotion window
- **WHEN** a user submits a request on 2026-10-15 for an event on 2027-01-10
- **THEN** no discount SHALL be applied

#### Scenario: Request after the opening day
- **WHEN** a user submits a request on 2026-10-19
- **THEN** no discount SHALL be applied

#### Scenario: Stale page after the deadline
- **WHEN** the server receives a request with a discount after 2026-10-18 (Madrid)
- **THEN** it SHALL reject it and ask the user to reload the page

#### Scenario: Opening banners announce the discount
- **WHEN** a visitor sees the opening popup or the countdown card before the opening day ends
- **THEN** they SHALL read that there is a 10% discount on the rental for bookings made until 18 October (included) for events until 30/12/2026

#### Scenario: Discount shown in emails
- **WHEN** a discounted reservation is created
- **THEN** customer and admin emails SHALL show the discount amount
