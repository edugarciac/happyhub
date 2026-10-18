## MODIFIED Requirements

### Requirement: Reservation status after payments
After the deposit is paid the reservation SHALL show "Señal pagada"; after the full amount is paid (manually or by Stripe) it SHALL show "Pagado". "Marcar Realizado" SHALL only be available when the reservation is fully paid.

#### Scenario: Deposit paid
- **WHEN** the deposit of a reservation is paid
- **THEN** it SHALL show "Señal pagada" with the actions "Marcar pago total" and "Cancelar", and SHALL NOT offer "Marcar Realizado"

#### Scenario: Manual full payment
- **WHEN** the admin clicks "Marcar pago total" and chooses "Efectivo"
- **THEN** the reservation SHALL be fully paid with method cash, show "Pagado" and offer "Marcar Realizado"

#### Scenario: Stripe full payment
- **WHEN** Stripe confirms the payment of the remaining amount
- **THEN** the reservation SHALL show "Pagado" and offer "Marcar Realizado"

#### Scenario: Completing without full payment
- **WHEN** the API receives `completed` for a reservation that is not fully paid
- **THEN** it SHALL respond 400
