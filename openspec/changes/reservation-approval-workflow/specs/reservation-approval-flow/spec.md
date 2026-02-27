## ADDED Requirements

### Requirement: Trigger n8n workflow on reservation submission
The system SHALL call n8n workflow immediately after customer submits reservation form.

#### Scenario: Customer submits reservation
- **WHEN** customer completes reservation form and clicks submit
- **THEN** system sends reservation data to n8n webhook at N8N_WEBHOOK_URL

#### Scenario: n8n workflow processes reservation
- **WHEN** n8n receives reservation data
- **THEN** n8n creates reservation in database with status='pending' and triggers notification workflows

### Requirement: Send initial confirmation email to customer
The system SHALL send confirmation email to customer immediately after reservation submission.

#### Scenario: Customer receives confirmation email
- **WHEN** reservation is created in database
- **THEN** n8n sends email to customer with subject "Reserva recibida - En revisión" and reservation summary

### Requirement: Send WhatsApp notification to admin
The system SHALL send WhatsApp message to HappyHub business number when new reservation is submitted.

#### Scenario: Admin receives WhatsApp with approval link
- **WHEN** new reservation is created
- **THEN** n8n sends WhatsApp to +34624645517 with message: "Nueva reserva #[ID] - [customer_name] - [event_date] [time_slot]" and link to approval page

#### Scenario: WhatsApp includes reservation summary
- **WHEN** admin opens WhatsApp message
- **THEN** message shows: customer name, email, phone, event date, time slot, guests, total price, and link to /admin/approve-reservation/[id]

### Requirement: Admin approves reservation
The system SHALL allow admin to approve reservation from approval page.

#### Scenario: Admin clicks approve button
- **WHEN** admin reviews reservation and clicks "Aprobar Reserva"
- **THEN** system updates reservation status to 'approved', records admin email, sets approved_at timestamp

#### Scenario: Customer notified of approval
- **WHEN** reservation status changes to 'approved'
- **THEN** n8n sends email and WhatsApp to customer: "Tu reserva ha sido aprobada" with payment link

### Requirement: Admin rejects reservation with reason
The system SHALL require admin to provide rejection reason when declining reservation.

#### Scenario: Admin rejects with reason
- **WHEN** admin clicks "Rechazar" and enters reason "Fecha no disponible"
- **THEN** system updates reservation status to 'rejected', stores rejection_reason

#### Scenario: Customer notified of rejection
- **WHEN** reservation status changes to 'rejected'
- **THEN** n8n sends email and WhatsApp to customer: "Tu reserva ha sido rechazada" with rejection reason and alternative dates suggestion
