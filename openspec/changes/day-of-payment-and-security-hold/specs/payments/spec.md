## MODIFIED Requirements

### Requirement: Day-of payment
The remaining amount SHALL be collected on the event day before it starts, by card through a payment link/QR or by a card terminal. Bizum SHALL NOT be offered for the remaining amount.

### Requirement: Security deposit hold
A 150 € authorization SHALL be placed on the customer's card on the event day, together with the remaining payment. It SHALL be released after inspection, or partially captured for documented damages, within the authorization window (up to 7 days online).

#### Scenario: Two-step payment page
- **WHEN** the customer opens the day-of payment link
- **THEN** the page SHALL show step 1 (remaining) and step 2 (150 € hold) and SHALL stay valid until both are done

#### Scenario: Admin releases or charges the hold
- **WHEN** the admin releases the hold or charges damages up to 150 €
- **THEN** Stripe SHALL cancel or partially capture the authorization and the reservation SHALL record the result

### Requirement: Clear conditions
Terms, contract, PDF, FAQ and emails SHALL explain: 30% deposit at approval (card or Bizum); remaining + 150 € hold on the event day (card only, credit or debit; with debit the amount is held from the balance); release after inspection, up to 7 days; no payment, no event start.

### Requirement: No early-payment reminders
The system SHALL NOT send reminders demanding the remaining payment before the event day.
