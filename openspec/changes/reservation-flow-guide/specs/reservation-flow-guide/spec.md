## ADDED Requirements

### Requirement: Reservation flow guide
The admin reservations page SHALL offer a "Cómo funciona" button that opens a diagram of all reservation states and the admin buttons and automatic events that move a reservation between them.

#### Scenario: Open the guide
- **WHEN** an admin clicks "Cómo funciona"
- **THEN** a popup SHALL show the states Pendiente, Aprobada, Señal pagada, Pagado, Evento Realizado and Cancelada, with the transitions, the security deposit and extra charges, and SHALL close with the X or by clicking outside
