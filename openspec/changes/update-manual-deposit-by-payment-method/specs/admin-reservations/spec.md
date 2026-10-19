## MODIFIED Requirements

### Requirement: Manual deposit action depends on payment method
The admin reservations list SHALL label the manual deposit action according to the reservation's payment method and SHALL warn before marking a card reservation as paid manually.

#### Scenario: Bizum reservation awaiting deposit
- **WHEN** an approved reservation with payment method Bizum has no deposit paid
- **THEN** the "Más" menu SHALL show "Señal recibida (Bizum)" first in the Pagos section

#### Scenario: Card reservation awaiting deposit
- **WHEN** an approved reservation with a non-Bizum payment method has no deposit paid
- **THEN** the "Más" menu SHALL show "Marcar señal pagada (manual)" last in the Pagos section
- **AND** clicking it SHALL show a confirmation explaining that card payments confirm automatically and the action is only for payments received by another channel
