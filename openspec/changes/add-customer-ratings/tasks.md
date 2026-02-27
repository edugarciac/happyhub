## 1. Database Setup

- [x] 1.1 Create database migration script for reviews table with schema from design.md
- [x] 1.2 Add UNIQUE constraint on reservation_id and CHECK constraints for rating (1-5) and review_text (≤500 chars)
- [x] 1.3 Create indexes: idx_reviews_published (is_published, created_at DESC) and idx_reviews_reservation (reservation_id)
- [x] 1.4 Add updated_at trigger using existing update_updated_at_column() function
- [x] 1.5 Test migration up/down scripts and verify constraints work as expected

## 2. Validation Schema

- [x] 2.1 Add reviewSchema to src/utils/validators.ts with Zod validation for rating (1-5) and review_text (optional, max 500)
- [x] 2.2 Add server-side validation helpers for reservation eligibility (status='confirmed', event_date < today)
- [x] 2.3 Test validation schema with edge cases (empty text, exactly 500 chars, invalid ratings)

## 3. API Endpoints - Submit Review

- [x] 3.1 Create POST /api/reviews endpoint with JWT authentication check
- [x] 3.2 Validate reservation exists and belongs to authenticated user (email match)
- [x] 3.3 Check reservation status is 'confirmed' and event_date is in the past
- [x] 3.4 Check no existing review for this reservation_id (handle unique constraint)
- [x] 3.5 Insert review with is_published=false, store customer_name from reservation
- [x] 3.6 Return 201 Created with review data or appropriate error (400/401/403/409)
- [x] 3.7 Test endpoint with Postman: valid submission, duplicate, unauthorized, wrong reservation

## 4. API Endpoints - Fetch Reviews

- [x] 4.1 Create GET /api/reviews endpoint (public, no auth required)
- [x] 4.2 Query reviews WHERE is_published=true ORDER BY created_at DESC
- [x] 4.3 Add pagination support with limit and offset query params (default limit=10)
- [x] 4.4 Return array of reviews with id, rating, review_text, customer_name, created_at
- [x] 4.5 Test endpoint: published reviews visible, unpublished filtered out, pagination works

## 5. API Endpoints - Stats and Admin

- [x] 5.1 Create GET /api/reviews/stats endpoint (public, no auth)
- [x] 5.2 Calculate ROUND(AVG(rating), 1) and COUNT(*) from published reviews only
- [x] 5.3 Return {average: number|null, count: number} (null when no reviews)
- [x] 5.4 Create PATCH /api/reviews/[id]/publish endpoint with admin role check
- [x] 5.5 Update is_published field, only allow if JWT role='admin'
- [x] 5.6 Test stats endpoint with 0, 1, and multiple reviews; test admin publish with non-admin JWT

## 6. Star Rating Component

- [x] 6.1 Create src/components/StarRating.tsx with interactive and read-only modes
- [x] 6.2 Implement interactive mode: clickable stars that set value (1-5)
- [x] 6.3 Implement read-only mode: display filled stars based on rating value
- [x] 6.4 Add half-star support for displaying decimal averages (e.g., 4.3 stars)
- [x] 6.5 Style with Tailwind following HappyHub color scheme (primary/accent colors)

## 7. Review Form Component

- [x] 7.1 Create src/components/ReviewForm.tsx using React Hook Form + reviewSchema
- [x] 7.2 Add StarRating component (interactive) for rating input
- [x] 7.3 Add textarea for optional review_text with character counter (0/500)
- [x] 7.4 Implement form submission to POST /api/reviews with JWT token
- [x] 7.5 Show success message on submit and error messages for validation failures
- [x] 7.6 Disable submit button while submitting and after successful submission

## 8. Review Display Components

- [x] 8.1 Create src/components/ReviewCard.tsx to display individual review
- [x] 8.2 Show customer_name, StarRating (read-only), review_text (if present), and formatted created_at
- [x] 8.3 Create src/components/ReviewList.tsx that fetches GET /api/reviews
- [x] 8.4 Display paginated list of ReviewCard components with "Load More" button
- [x] 8.5 Handle empty state when no reviews exist ("Be the first to review!")

## 9. Homepage Integration

- [x] 9.1 Update src/components/Hero.tsx to fetch /api/reviews/stats on mount
- [x] 9.2 Replace hardcoded "4.9/5" with dynamic average rating from API
- [x] 9.3 Update "Más de 500 eventos exitosos" with real review count
- [x] 9.4 Add loading state and fallback to hide rating badge when no reviews exist
- [x] 9.5 Test Hero component displays correct data and handles zero reviews gracefully

## 10. Admin Dashboard

- [ ] 10.1 Add "Pending Reviews" section to src/pages/admin.tsx (admin role only)
- [ ] 10.2 Fetch reviews WHERE is_published=false using modified GET /api/reviews endpoint
- [ ] 10.3 Display each pending review with customer_name, rating, text, and reservation details
- [ ] 10.4 Add "Approve" button that calls PATCH /api/reviews/[id]/publish
- [ ] 10.5 Refresh list after approval and show success notification

## 11. Review Submission Flow

- [ ] 11.1 Update src/pages/mi-reserva/[id].tsx to show "Write a Review" button
- [ ] 11.2 Only show button if reservation status='confirmed' and event_date < today and no existing review
- [ ] 11.3 Add modal or dedicated section with ReviewForm component
- [ ] 11.4 Handle form submission and show confirmation message
- [ ] 11.5 Test end-to-end: load reservation page, click review button, submit, see confirmation

## 12. n8n Integration

- [ ] 12.1 Update n8n workflow to send review request email 24 hours after event_date
- [ ] 12.2 Filter to reservations with status='confirmed' and no existing review in reviews table
- [ ] 12.3 Include link to /mi-reserva/[id]?action=review in email template
- [ ] 12.4 Test n8n workflow in staging: trigger email, verify link works, submit review
- [ ] 12.5 Add admin email notification when new review is submitted (pending approval)

## 13. Service Pages Integration

- [ ] 13.1 Add ReviewList component to src/pages/servicios.tsx below service descriptions
- [ ] 13.2 Show aggregate rating from /api/reviews/stats at top of reviews section
- [ ] 13.3 Test layout and ensure reviews display correctly on mobile and desktop

## 14. Testing & Quality Assurance

- [ ] 14.1 Test full customer flow: event completion → email link → review submission → admin approval → public display
- [ ] 14.2 Test edge cases: duplicate review, unauthorized access, future event, invalid rating
- [ ] 14.3 Verify database constraints prevent invalid data (rating out of range, text too long)
- [ ] 14.4 Test pagination and performance with 50+ reviews in database
- [ ] 14.5 Cross-browser testing (Chrome, Safari, Firefox) and mobile responsiveness

## 15. Documentation & Deployment

- [ ] 15.1 Update docs/project_notes/decisions.md with ADR for ratings system architecture
- [ ] 15.2 Update docs/project_notes/key_facts.md with review API endpoints and database schema
- [ ] 15.3 Add review submission documentation to README or user guide
- [ ] 15.4 Create rollback script to revert Hero component and drop reviews table if needed
- [x] 15.5 Deploy to production and monitor for errors in first 48 hours
