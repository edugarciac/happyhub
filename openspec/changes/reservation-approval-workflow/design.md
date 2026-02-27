## Context

HappyHub currently sends reservations to n8n but lacks approval workflow. Reservations go from submission directly to pending state without admin review. Need WhatsApp-first admin notification (business uses WhatsApp primarily) and automated customer communications.

Existing: n8n production instance (52.208.80.224), WhatsApp Business API token, reservation form, email service via n8n.

## Goals / Non-Goals

**Goals:**
- Automated admin notification via WhatsApp for new reservations
- Dedicated approval page with all reservation details
- Email notifications to customers at each stage (received, approved, rejected)
- Track admin who approved and rejection reasons
- WhatsApp notifications to customers after approval/rejection

**Non-Goals:**
- In-app notifications (push/browser notifications)
- SMS notifications (only WhatsApp)
- Approval via WhatsApp button click (link to web page instead)
- Multi-step approval (single approve/reject decision)
- Partial approvals or conditions

## Decisions

### Decision 1: n8n Workflow Architecture

**Choice:** Extend existing webhook at `/webhook/reservation-request` with approval branches.

**Flow:**
```
Customer submits → n8n webhook
  ├─→ Create reservation (status='pending')
  ├─→ Send email to customer: "Recibida, bajo revisión"
  ├─→ Send WhatsApp to admin: details + link
  └─→ Wait for admin action (polling or webhook)

Admin approves/rejects → API call
  ├─→ Update reservation status
  ├─→ n8n triggers notification workflow
  ├─→ Send email to customer: approved/rejected
  └─→ Send WhatsApp to customer: approved/rejected
```

**Rationale:**
- Single webhook entry point maintains simplicity
- Branching logic handles approve/reject paths
- Async workflow allows admin to review at convenience
- Polling reservation status or webhook callback from API

**Alternatives considered:**
- Separate n8n workflows for each stage: Rejected, harder to maintain and debug
- Synchronous approval (wait for admin): Rejected, blocks customer form submission
- Email-only notifications: Rejected, WhatsApp is preferred contact method

### Decision 2: WhatsApp Message Format

**Choice:** Use WhatsApp Business API with formatted message and direct link.

**Message Template:**
```
🆕 Nueva Reserva #[ID]

👤 [customer_name]
📧 [customer_email]
📞 [customer_phone]

📅 Fecha: [event_date]
⏰ Horario: [time_slot_readable]
🎉 Tipo: [event_type]
👥 Invitados: [guests]
💰 Precio: [total_price]€

👉 Revisar y aprobar:
https://www.happyhub.es/admin/approve-reservation/[id]
```

**Rationale:**
- Emojis improve readability in WhatsApp
- All critical info visible without clicking link
- Direct link reduces friction (single tap to review)
- Mobile-optimized (admin likely checks phone first)

**Alternatives considered:**
- Interactive WhatsApp buttons: Rejected, requires approved WhatsApp template and takes 24-48h Meta approval
- Plain text without link: Rejected, requires admin to manually navigate
- Shortened URL: Unnecessary complexity for now

### Decision 3: Approval Page Design

**Choice:** Simple form with reservation summary, approve button, reject button with reason textarea.

**Layout:**
```
┌─────────────────────────────────────┐
│ Reservation #123                     │
│ Status: Pending                      │
├─────────────────────────────────────┤
│ Customer Information                 │
│ - Name, email, phone                 │
│                                      │
│ Event Details                        │
│ - Date, time, type, guests           │
│                                      │
│ Pricing                              │
│ - Base price, total                  │
├─────────────────────────────────────┤
│ [Aprobar Reserva] [Rechazar]        │
│                                      │
│ (if reject clicked)                  │
│ Motivo: [____________]               │
│ [Confirmar Rechazo]                  │
└─────────────────────────────────────┘
```

**Rationale:**
- All info visible without scrolling
- Clear CTAs (approve/reject)
- Mandatory reason field prevents accidental rejections
- Mobile-friendly (WhatsApp link opens on phone)

**Alternatives considered:**
- Two-step approval (review then confirm): Rejected, adds unnecessary clicks
- Dropdown with rejection reasons: Deferred, free text more flexible for now
- Calendar view showing conflicts: Deferred to future enhancement

### Decision 4: Database Schema Updates

**Choice:** Add 3 columns to reservations table for approval tracking.

**Migration:**
```sql
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
```

**Rationale:**
- `rejection_reason` stores admin's explanation (nullable)
- `admin_approved_by` tracks accountability (email of admin)
- `approved_at` timestamp for SLA tracking

**Alternatives considered:**
- Separate approval_history table: Rejected, over-engineering for single approval
- No tracking of who approved: Rejected, accountability important
- Use existing updated_at field: Rejected, doesn't capture approval-specific timestamp

### Decision 5: Customer Notification Strategy

**Choice:** Email + WhatsApp dual notification for critical status changes.

**Channels:**
- Email: Formal confirmation with full details
- WhatsApp: Quick notification with key info

**Timing:**
- Immediate: "Reserva recibida" (within seconds of submission)
- Admin-triggered: Approval/rejection (immediately after admin action)

**Rationale:**
- Dual channel ensures customer receives notification
- Email provides paper trail
- WhatsApp higher open rate for immediate awareness
- Customers already use WhatsApp to contact business

**Alternatives considered:**
- Email only: Rejected, lower engagement than WhatsApp
- WhatsApp only: Rejected, no formal documentation
- In-app notification: Deferred, requires customer to log in

## Risks / Trade-offs

**[Risk] WhatsApp API rate limits or failures**
→ Mitigation: Fallback to email if WhatsApp fails. Monitor API usage and errors in n8n logs.

**[Risk] Admin misses WhatsApp notification**
→ Mitigation: Email fallback to admin if no action within 24h (future enhancement). For now, single WhatsApp message.

**[Risk] Customer doesn't see rejection reason**
→ Mitigation: Include rejection reason prominently in both email subject and WhatsApp message.

**[Risk] Duplicate approvals if multiple admins**
→ Mitigation: Disable buttons after first action, check status before allowing approve/reject.

**[Risk] n8n workflow failure leaves reservation in limbo**
→ Mitigation: Reservation created in database first, notifications are async. Admin can manually follow up.

**[Trade-off] No in-app admin notifications**
→ WhatsApp-first approach simpler, matches business workflow. In-app notifications deferred.

**[Trade-off] Single approval step (no escalation)**
→ Simplifies workflow, sufficient for single-location business. Multi-level approval deferred.

## Migration Plan

**Phase 1: Database Updates**
1. Create migration script to add approval columns to reservations
2. Run migration on production database
3. Verify columns exist and nullable constraints correct

**Phase 2: API Endpoints**
1. Create POST /api/admin/reservations/[id]/approve
2. Create POST /api/admin/reservations/[id]/reject
3. Test endpoints with Postman and admin JWT

**Phase 3: Approval Page**
1. Create /admin/approve-reservation/[id] page
2. Implement approve/reject forms with validation
3. Add status display and action button logic
4. Test approve and reject flows

**Phase 4: n8n Workflow**
1. Update existing workflow with approval nodes
2. Add WhatsApp send node with Business API
3. Add email send nodes for customer notifications
4. Configure webhook calls to approve/reject endpoints
5. Test workflow end-to-end in n8n UI

**Phase 5: Integration**
1. Update reservation form to call n8n webhook
2. Test complete flow: submit → email → WhatsApp → approve → notifications
3. Test rejection flow with various reasons
4. Verify email deliverability and WhatsApp sending

**Rollback Strategy:**
- Revert reservation form to not call workflow (old behavior)
- Keep approval columns (nullable, no breaking changes)
- Disable n8n workflow nodes
- Admin can still manually update reservation status in database

## Open Questions

1. **WhatsApp template approval:** Do we need Meta-approved templates or can we use free-form messages? → Decision: Start with free-form, may require approved template if volume exceeds 1000 conversations/month.

2. **Approval timeout:** Should reservations auto-reject if not reviewed within X hours? → Decision: No auto-reject in MVP, manual follow-up acceptable.

3. **Payment link timing:** When to send payment link - immediately on approval or after calendar confirmed? → Decision: Immediately on approval, calendar creation is secondary.

4. **Multiple admins:** How to handle if two admins click link simultaneously? → Decision: First action wins, second sees "already processed" message.

5. **Customer can resubmit rejected reservation:** Should rejected reservations allow customer to modify and resubmit? → Decision: No, customer must submit new reservation form.
