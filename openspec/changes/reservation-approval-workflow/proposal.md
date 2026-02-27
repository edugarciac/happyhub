## Why

Currently reservations lack admin approval workflow. Customers submit reservations without knowing if they're accepted, and admin has no streamlined notification or approval interface. Need automated workflow via n8n with WhatsApp notifications to admin and email updates to customers for efficient business operations.

## What Changes

- Call n8n workflow when customer submits reservation form
- n8n sends confirmation email to customer: "Reserva recibida, bajo revisión"
- n8n sends WhatsApp to HappyHub business number: "Nueva reserva [link]" with approve/reject buttons
- Create approval page `/admin/approve-reservation/[id]` with full details and action buttons
- When admin approves/rejects via WhatsApp link, update reservation status in database
- Send email to customer with approval confirmation or rejection reason
- Send WhatsApp to customer after approval/rejection

## Capabilities

### New Capabilities
- `reservation-approval-flow`: End-to-end approval workflow from submission to customer notification
- `whatsapp-admin-notifications`: WhatsApp messages to HappyHub business number for new reservations
- `reservation-approval-page`: Admin page for reviewing and approving/rejecting reservations with reason

### Modified Capabilities
<!-- No existing capabilities modified at requirements level -->

## Impact

**n8n Workflow:**
- New workflow: `reservation-approval-workflow.json`
- Nodes: Webhook trigger, Send email to customer, Send WhatsApp to admin, Wait for webhook response, Update reservation status, Send notification to customer
- Integration with existing WhatsApp Business API (token stored in .env.local)

**New Pages:**
- `/admin/approve-reservation/[id]` - Approval page with reservation details and approve/reject form

**New API Endpoints:**
- `POST /api/webhooks/reservation-approval` - Webhook for n8n to send approval data
- `POST /api/admin/reservations/[id]/approve` - Approve reservation
- `POST /api/admin/reservations/[id]/reject` - Reject reservation with reason

**Database Changes:**
- Add `rejection_reason` column to reservations table (if not exists)
- Add `admin_approved_by` column to track who approved (email of admin)
- Add `approved_at` timestamp column

**Email Templates:**
- "Reserva recibida" - Initial confirmation to customer
- "Reserva aprobada" - Approval notification
- "Reserva rechazada" - Rejection notification with reason

**WhatsApp Templates:**
- Admin notification with reservation details and approval link
- Customer confirmation after approval
- Customer notification after rejection with reason

**External Services:**
- WhatsApp Business API using WHATSAPP_API_TOKEN
- n8n workflow orchestration
- Email service (via n8n)
