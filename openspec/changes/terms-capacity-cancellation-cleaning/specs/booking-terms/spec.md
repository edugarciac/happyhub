## MODIFIED Requirements

### Requirement: Consistent booking terms
All customer-facing terms (booking summary, terms page, contract, PDF, FAQs) SHALL state: maximum capacity 50 people; cancellations less than 3 days before the event forfeit the deposit; the space must be left completely tidy and in the same condition it was delivered; non-compliance may carry economic consequences, e.g. a 50 € cleaning charge.

#### Scenario: Customer reads the summarized terms before booking
- **WHEN** the customer reaches the terms box in the booking form
- **THEN** it SHALL show capacity 50, the 3-day cancellation rule, the tidy-space obligation and the 50 € cleaning example

#### Scenario: Guest limit
- **WHEN** a booking or admin form sets the number of guests
- **THEN** the maximum SHALL be 50
