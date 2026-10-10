## MODIFIED Requirements

### Requirement: Full terms must be read before accepting
The booking form SHALL display the full terms and conditions (same text as `/terminos`) and SHALL keep the acceptance checkbox disabled until the customer scrolls to the end of the text.

#### Scenario: Customer has not scrolled to the end
- **WHEN** the terms box is shown and the customer has not reached its end
- **THEN** the acceptance checkbox SHALL be disabled with the hint "Desplázate hasta el final para poder aceptar"

#### Scenario: Customer reaches the end
- **WHEN** the customer scrolls to the end of the terms
- **THEN** the checkbox SHALL become enabled and the hint SHALL change to "Has leído los términos completos"

### Requirement: Detailed terms cover all booking rules
The `/terminos` page SHALL include the approval-then-payment process (24 h to pay), card/Bizum payment methods, the 3-day cancellation rule, free date change up to 30 days before, 50-person capacity, the tidy-space obligation and the 50 € cleaning charge.
