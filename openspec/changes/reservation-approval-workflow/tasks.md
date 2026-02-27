## 1. Database Migration

- [x] 1.1 Create database/migrations/004_add_reservation_approval_fields.sql
- [x] 1.2 Add rejection_reason TEXT column to reservations table
- [x] 1.3 Add admin_approved_by VARCHAR(255) column to reservations table
- [x] 1.4 Add approved_at TIMESTAMP column to reservations table
- [x] 1.5 Run migration on production database and verify columns exist

## 2. API - Approve Endpoint

- [x] 2.1 Create POST /api/admin/reservations/[id]/approve endpoint
- [x] 2.2 Check JWT authentication and verify role='admin'
- [x] 2.3 Validate reservation exists and status='pending'
- [x] 2.4 Update reservation: status='approved', admin_approved_by=admin_email, approved_at=NOW()
- [x] 2.5 Return success with updated reservation data
- [x] 2.6 Test approve endpoint prevents non-admin access and handles edge cases

## 3. API - Reject Endpoint

- [x] 3.1 Create POST /api/admin/reservations/[id]/reject endpoint
- [x] 3.2 Check JWT authentication and verify role='admin'
- [x] 3.3 Validate request body includes rejection_reason (required)
- [x] 3.4 Validate reservation exists and status='pending'
- [x] 3.5 Update reservation: status='rejected', rejection_reason, admin_approved_by=admin_email
- [x] 3.6 Return success with updated reservation data
- [x] 3.7 Test reject endpoint requires reason and prevents duplicate rejections

## 4. Approval Page UI

- [x] 4.1 Create src/pages/admin/approve-reservation/[id].tsx
- [x] 4.2 Fetch reservation details from GET /api/admin/reservations/[id]
- [x] 4.3 Display customer info section (name, email, phone)
- [x] 4.4 Display event details section (date, time_slot, event_type, guests)
- [x] 4.5 Display pricing section (base_price, total_price, deposit info)
- [x] 4.6 Show status badge (pending, approved, rejected)
- [x] 4.7 Add "Aprobar Reserva" button (green, calls approve endpoint)
- [x] 4.8 Add "Rechazar" button (red, shows reason textarea)
- [x] 4.9 Add rejection reason form with validation
- [x] 4.10 Disable buttons if status is not 'pending'
- [x] 4.11 Show success/error messages with toast notifications
- [x] 4.12 Style with Tailwind following HappyHub design system

## 5. n8n Workflow - Customer Confirmation Email

- [ ] 5.1 Open n8n workflow editor (http://52.208.80.224:5678)
- [ ] 5.2 Add "Send Customer Confirmation Email" node after reservation creation
- [ ] 5.3 Configure email template with subject "Reserva recibida - En revisión"
- [ ] 5.4 Include reservation summary in email body (date, time, guests, price)
- [ ] 5.5 Add message: "Revisaremos tu solicitud y te contactaremos en breve"
- [ ] 5.6 Test email sends correctly to customer email address

## 6. n8n Workflow - WhatsApp Admin Notification

- [ ] 6.1 Add "Send WhatsApp to Admin" node after customer email sent
- [ ] 6.2 Configure WhatsApp Business API with WHATSAPP_API_TOKEN
- [ ] 6.3 Set recipient to +34624645517 (HappyHub business number)
- [ ] 6.4 Format message with emojis: 🆕 Nueva Reserva, customer details, price
- [ ] 6.5 Include link: https://www.happyhub.es/admin/approve-reservation/[reservation_id]
- [ ] 6.6 Add error handling: if WhatsApp fails, send email to admin
- [ ] 6.7 Test WhatsApp message sends and displays correctly on mobile

## 7. n8n Workflow - Approval Notification

- [ ] 7.1 Create new workflow or branch: "Reservation Status Changed"
- [ ] 7.2 Trigger when reservation status updates to 'approved' or 'rejected'
- [ ] 7.3 Add conditional branch: if approved → send approval notifications
- [ ] 7.4 Add conditional branch: if rejected → send rejection notifications with reason
- [ ] 7.5 Configure approval email template with payment link and next steps
- [ ] 7.6 Configure rejection email template with rejection reason and suggestion to resubmit
- [ ] 7.7 Add WhatsApp notification nodes for both approval and rejection
- [ ] 7.8 Test both approval and rejection notification flows

## 8. Webhook Integration

- [ ] 8.1 Update src/pages/api/webhook-reserva.ts to pass all reservation data to n8n
- [ ] 8.2 Ensure n8n receives: name, email, phone, event_date, time_slot, event_type, guests, total_price
- [ ] 8.3 Return reservation_id to frontend after n8n processes
- [ ] 8.4 Update reservation form success page to show "En revisión" message
- [ ] 8.5 Test webhook payload structure matches n8n expectations

## 9. Email Templates

- [ ] 9.1 Create HTML email template for "Reserva recibida"
- [ ] 9.2 Create HTML email template for "Reserva aprobada" with payment link
- [ ] 9.3 Create HTML email template for "Reserva rechazada" with dynamic rejection_reason
- [ ] 9.4 Use consistent HappyHub branding (colors, logo)
- [ ] 9.5 Make emails mobile-responsive
- [ ] 9.6 Test email rendering in Gmail, Outlook, mobile clients

## 10. WhatsApp Message Helpers

- [x] 10.1 Create src/lib/whatsapp.ts with sendWhatsAppMessage function
- [x] 10.2 Implement formatReservationForWhatsApp helper (customer-facing)
- [x] 10.3 Implement formatReservationForAdmin helper (admin notification)
- [x] 10.4 Add error handling and logging for WhatsApp API calls
- [x] 10.5 Test WhatsApp helpers with actual API token

## 11. Status Tracking

- [ ] 11.1 Update reservation status history tracking (if using reservation_status_history table)
- [ ] 11.2 Log status changes with admin email and timestamp
- [ ] 11.3 Create GET /api/admin/reservations/[id]/history endpoint (optional)
- [ ] 11.4 Display status history on approval page (optional enhancement)

## 12. Testing and Validation

- [ ] 12.1 Test complete flow: submit → customer email → admin WhatsApp → approve → notifications
- [ ] 12.2 Test rejection flow with different reasons
- [ ] 12.3 Test duplicate approval attempts (should be blocked)
- [ ] 12.4 Test WhatsApp API failures trigger email fallback
- [ ] 12.5 Test mobile UX on approval page (admin uses phone)
- [ ] 12.6 Verify email deliverability (check spam folders)
- [ ] 12.7 Load test n8n workflow with 10 concurrent reservations

## 13. Documentation

- [ ] 13.1 Update docs/project_notes/key_facts.md with approval workflow endpoints
- [ ] 13.2 Document WhatsApp message templates in docs/
- [ ] 13.3 Update n8n workflow documentation with approval flow diagram
- [ ] 13.4 Add troubleshooting guide for common workflow failures
- [ ] 13.5 Document how to check n8n logs for approval workflow issues

## 14. Deployment

- [ ] 14.1 Add WHATSAPP_API_TOKEN to Amplify environment variables
- [ ] 14.2 Commit all code changes (migration, API endpoints, approval page)
- [ ] 14.3 Deploy n8n workflow updates to production instance
- [ ] 14.4 Run database migration on production
- [ ] 14.5 Test production flow with real test reservation
- [ ] 14.6 Monitor n8n execution logs for first 24 hours
