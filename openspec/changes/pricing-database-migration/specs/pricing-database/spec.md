## ADDED Requirements

### Requirement: Store pricing rules in the database
The system SHALL persist base venue rental prices in a `pricing_rules` table keyed by `day_type` and `time_slot`, instead of hardcoding them in application code.

#### Scenario: Rule has a price and validity window
- **WHEN** a pricing rule is created
- **THEN** it has `day_type`, `time_slot`, `price` (>= 0), optional `effective_from`/`effective_to` dates, and an `active` flag

### Requirement: Expose current active prices publicly
The system SHALL expose the currently active prices via a read-only endpoint for the booking flow to consume.

#### Scenario: Booking flow fetches current prices
- **WHEN** a client requests `GET /api/pricing/current`
- **THEN** the system returns only rules where `active = true` and the current date falls within `effective_from`/`effective_to` (when set), keyed by `${day_type}_${time_slot}`

#### Scenario: Pricing API unavailable
- **WHEN** the pricing API request fails
- **THEN** the booking flow falls back to the last-known hardcoded price values so booking is never blocked by a pricing outage
