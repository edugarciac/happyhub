## MODIFIED Requirements

### Requirement: Confirmation screen only promises real notifications
The booking confirmation screen SHALL NOT promise a WhatsApp to the customer, and SHALL state that HappyHub will get in touch "en los próximos días".

#### Scenario: Customer finishes a booking
- **WHEN** the customer reaches the final step
- **THEN** the next-steps list SHALL mention the confirmation email and the deposit link, without WhatsApp or a 24-hour promise
