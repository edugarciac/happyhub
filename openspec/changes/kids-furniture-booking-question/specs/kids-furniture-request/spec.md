## ADDED Requirements

### Requirement: Customer can flag a need for children's tables/chairs during booking
The booking flow SHALL present a yes/no question asking whether children's tables and chairs need to be prepared, with copy clarifying it has no effect on price or capacity, and SHALL persist the answer with the reservation.

#### Scenario: Customer answers yes
- **WHEN** a customer completes the booking form with the kids-furniture question answered "Sí"
- **THEN** the created reservation stores `needs_kids_furniture = true`

#### Scenario: Customer answers no or leaves default
- **WHEN** a customer completes the booking form without checking the kids-furniture question
- **THEN** the created reservation stores `needs_kids_furniture = false`

### Requirement: Admin sees the flag in time to prepare
The admin reservations list and the approval detail page SHALL display whether a reservation needs children's furniture, and the list SHALL allow admin to change it after creation.

#### Scenario: Viewing the reservations list
- **WHEN** admin opens the reservations list and a reservation has `needs_kids_furniture = true`
- **THEN** that reservation shows a visible indicator distinguishing it from reservations that don't need it

#### Scenario: Admin corrects the flag after booking
- **WHEN** admin edits a reservation and toggles the kids-furniture flag
- **THEN** the change is persisted and reflected on next view

### Requirement: New-reservation WhatsApp notification includes the flag when set
The admin WhatsApp notification sent when a reservation is created SHALL include a line noting children's furniture is needed, only when the flag is true.

#### Scenario: Reservation needs kids furniture
- **WHEN** a reservation is created with `needs_kids_furniture = true`
- **THEN** the "Nueva solicitud de reserva" WhatsApp message includes a line indicating tables/chairs for children are needed

#### Scenario: Reservation doesn't need kids furniture
- **WHEN** a reservation is created with `needs_kids_furniture = false`
- **THEN** the WhatsApp message omits any mention of children's furniture

### Requirement: Flag is excluded from the customer-facing contract
The generated reservation contract PDF SHALL NOT include the children's furniture flag, since it is an internal operational note rather than a contractual term.

#### Scenario: Generating a contract for a reservation with the flag set
- **WHEN** a contract PDF is generated for a reservation with `needs_kids_furniture = true`
- **THEN** the PDF content is unaffected — no new line, section, or mention is added
