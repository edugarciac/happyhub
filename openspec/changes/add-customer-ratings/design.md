## Context

HappyHub currently displays hardcoded rating (4.9/5) in the Hero component. The platform has a reservations system with status tracking ('pending', 'approved', 'confirmed', 'cancelled') and integrates with n8n for workflow automation, Stripe for payments, and stores data in Neon PostgreSQL.

Customer authentication exists via JWT tokens stored in localStorage. The application uses Next.js 14 (Pages Router), React Hook Form + Zod for validation, and follows existing patterns in `src/utils/validators.ts` and `src/lib/apiClient.ts`.

## Goals / Non-Goals

**Goals:**
- Replace fake homepage ratings with authentic customer feedback
- Allow only verified customers (completed reservations) to submit reviews
- Implement admin moderation to prevent spam/inappropriate content
- Display aggregate ratings and individual reviews publicly
- Integrate review requests into existing n8n post-event workflows

**Non-Goals:**
- Advanced review features (photos, video reviews, helpful voting)
- Review editing by customers after submission (final on submit)
- Multi-criteria ratings (separate ratings for venue, service, cleanliness, etc.)
- Review responses/replies from business
- Integration with third-party review platforms (Google Reviews, Trustpilot)

## Decisions

### Decision 1: Database Schema Design

**Choice:** Single `reviews` table with foreign key to `reservations` table.

**Schema:**
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT CHECK (length(review_text) <= 500),
  customer_name VARCHAR(255) NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_published ON reviews(is_published, created_at DESC);
CREATE INDEX idx_reviews_reservation ON reviews(reservation_id);
```

**Rationale:**
- UNIQUE constraint on `reservation_id` enforces one-review-per-reservation rule at database level
- `customer_name` denormalized from reservations for display without joins
- `is_published` boolean supports admin moderation workflow
- Index on (is_published, created_at DESC) optimizes public review queries
- CASCADE delete ensures orphaned reviews are cleaned up if reservation is deleted

**Alternatives considered:**
- Separate `ratings` and `reviews` tables: Rejected due to unnecessary complexity for current MVP scope
- No UNIQUE constraint, enforce in app code: Rejected as database constraint provides stronger guarantee

### Decision 2: API Endpoint Authorization

**Choice:** Use existing JWT authentication with role-based checks.

**Endpoints:**
- `POST /api/reviews`: Requires valid JWT, verifies reservation ownership via email match
- `GET /api/reviews`: Public (no auth), filters to `is_published = true`
- `GET /api/reviews/stats`: Public (no auth), calculates from published reviews only
- `PATCH /api/reviews/[id]/publish`: Requires JWT with `role = 'admin'`

**Rationale:**
- Reuses existing JWT infrastructure (`src/lib/apiClient.ts`)
- Reservation ownership check prevents users rating others' events
- Public read endpoints enable unauthenticated visitors to see social proof
- Admin-only publish maintains content quality control

**Alternatives considered:**
- Magic link for review submission (no login): Rejected to maintain accountability and prevent abuse
- Automatic publishing without moderation: Rejected due to spam/inappropriate content risk

### Decision 3: Frontend Component Structure

**Choice:** Create reusable components following existing patterns.

**New Components:**
- `src/components/ReviewForm.tsx`: React Hook Form + Zod validation for rating/review submission
- `src/components/ReviewCard.tsx`: Display individual review with stars, text, customer name, date
- `src/components/ReviewList.tsx`: Paginated list of ReviewCard components
- `src/components/StarRating.tsx`: Reusable star display (read-only and interactive modes)

**Component Updates:**
- `src/components/Hero.tsx`: Replace hardcoded `4.9` with dynamic value from `/api/reviews/stats`
- `src/pages/admin.tsx`: Add reviews moderation section with approve/reject buttons

**Rationale:**
- Follows existing component patterns in HappyHub (standalone, TypeScript, Tailwind styling)
- Zod schema in `src/utils/validators.ts` ensures consistent validation
- Admin moderation integrated into existing admin dashboard

**Alternatives considered:**
- Dedicated review management page: Deferred to future phase, admin dashboard sufficient for MVP
- Star rating library (react-rating-stars, etc.): Rejected to avoid external dependency for simple component

### Decision 4: Review Request Workflow

**Choice:** Extend existing n8n workflow to trigger review requests 24 hours after event completion.

**Implementation:**
- Add n8n node to check `event_date + 1 day = today`
- Filter reservations with `status = 'confirmed'` and no existing review
- Send email with personalized review link: `/mi-reserva/[id]?action=review`
- Link includes JWT token or reservation ID for authentication

**Rationale:**
- 24-hour delay ensures customers have experienced the full event
- Leverages existing n8n automation infrastructure
- Email link reduces friction (direct access to review form)
- Only sends to confirmed events that haven't been reviewed yet

**Alternatives considered:**
- Immediate review request in confirmation email: Rejected as event hasn't occurred yet
- SMS review request: Deferred to future phase pending WhatsApp Business integration
- In-app notification: Deferred until mobile app development

### Decision 5: Aggregate Rating Calculation

**Choice:** Real-time calculation via SQL query, no caching for MVP.

**Query:**
```sql
SELECT
  ROUND(AVG(rating), 1) as average_rating,
  COUNT(*) as total_reviews
FROM reviews
WHERE is_published = true;
```

**Rationale:**
- Simple, accurate, and sufficient for expected scale (< 1000 reviews in first year)
- PostgreSQL aggregate functions are fast enough for real-time queries
- No cache invalidation complexity

**Alternatives considered:**
- Materialized view with triggers: Over-engineering for current scale, adds maintenance burden
- Redis cache: Adds external dependency, premature optimization
- Pre-calculated field in settings table: Requires trigger/cron maintenance

## Risks / Trade-offs

**[Risk] Review spam or inappropriate content**
→ Mitigation: Admin approval required before publishing. Implement basic profanity filter in validation layer.

**[Risk] Low review submission rate**
→ Mitigation: Automated n8n email reminders 24 hours post-event. Consider incentives (discount codes) in future.

**[Risk] Database performance as reviews scale**
→ Mitigation: Index on (is_published, created_at DESC) handles queries efficiently. Monitor and add pagination if needed.

**[Risk] Negative reviews hurt conversion**
→ Trade-off: Authenticity builds trust long-term, outweighs short-term risk. Admin moderation filters extreme cases.

**[Risk] Customer disputes over review rejection**
→ Mitigation: Store rejection reason (admin_notes field) for transparency. Establish clear review guidelines.

**[Trade-off] No review editing post-submission**
→ Simplifies implementation, ensures review authenticity, but reduces flexibility for customers. Consider adding edit window in future.

**[Trade-off] Manual admin moderation required**
→ Ensures quality but doesn't scale indefinitely. Plan for auto-approval rules (e.g., verified customers with 5-star ratings) in future.

## Migration Plan

**Phase 1: Database Setup**
1. Run schema migration to create `reviews` table with indexes
2. Verify constraints and indexes applied correctly
3. Test with manual INSERT to validate schema

**Phase 2: API Development**
1. Implement `POST /api/reviews` with validation
2. Implement `GET /api/reviews` and `/api/reviews/stats`
3. Implement `PATCH /api/reviews/[id]/publish` with admin auth check
4. Test all endpoints with Postman/Insomnia

**Phase 3: Frontend Components**
1. Build StarRating component (reusable for display and input)
2. Build ReviewCard and ReviewList components
3. Update Hero component to fetch `/api/reviews/stats`
4. Create ReviewForm with validation
5. Add admin moderation UI to `/admin` dashboard

**Phase 4: Integration**
1. Update n8n workflow to include review request email
2. Test email template with review link
3. Verify end-to-end flow: reservation → event completion → email → review submission → admin approval → display

**Rollback Strategy:**
- Drop `reviews` table via migration down script
- Revert Hero component to show hardcoded 4.9 rating
- Remove API routes
- Remove n8n workflow nodes

## Open Questions

1. **Review character limit:** 500 characters chosen, but should we allow longer reviews for detailed feedback? → Decision: Keep 500 for MVP, can increase if needed.

2. **Star rating display granularity:** Show average as 4.8 or 4.75? → Decision: Round to 1 decimal (4.8) for simplicity.

3. **Review sorting:** Default to newest first or highest rating first? → Decision: Newest first (created_at DESC) to show recent feedback.

4. **Email template design:** Who designs review request email? → Needs coordination with n8n email template owner.

5. **Admin notification:** Should admins receive email when new review submitted? → Decision: Yes, add to n8n workflow.
