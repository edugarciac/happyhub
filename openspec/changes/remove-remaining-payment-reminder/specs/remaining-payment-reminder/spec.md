## REMOVED Requirements

### Requirement: Remaining payment reminder three days before the event
**Reason**: El resto se cobra el día del evento, justo antes de empezar, junto con el bloqueo de la fianza.
**Migration**: El admin cobra el resto con el QR/enlace del día del evento o el datáfono.

## MODIFIED Requirements

### Requirement: Advance link pays only the remaining amount
Advance links (`remaining_advance`) already sent SHALL keep letting the customer pay the remaining amount only until they expire; no new advance links SHALL be created.

#### Scenario: Previously sent link
- **WHEN** a customer opens an unexpired `remaining_advance` link sent before this change
- **THEN** they SHALL be able to pay the remaining amount only, and the security deposit SHALL still be held on the event day

#### Scenario: No new reminder
- **WHEN** the daily cron runs for a confirmed reservation with an unpaid remaining amount whose event is in 3 days
- **THEN** no reminder email SHALL be sent
