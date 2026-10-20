## MODIFIED Requirements

### Requirement: Cancel dialog explains the cancellation policy
The cancel dialog SHALL always show the consequence of cancelling according to the days left before the event.

#### Scenario: 15 or more days
- **WHEN** the admin cancels a reservation 22 days before the event with 60 € paid
- **THEN** the dialog SHALL say that the paid amount (60 €) is refunded and the refund checkbox SHALL be checked

#### Scenario: Between 14 and 3 days
- **WHEN** the admin cancels 8 days before the event
- **THEN** the dialog SHALL say that the deposit is not refunded, that the date can be changed and that cancelling loses the deposit
- **AND** it SHALL offer "Cambiar la fecha en lugar de cancelar", opening the reservation edit form

#### Scenario: Less than 3 days
- **WHEN** the admin cancels 1 day before the event
- **THEN** the dialog SHALL say that neither a refund nor a date change is possible
