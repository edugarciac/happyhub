## Why

HappyHub currently displays fake ratings (4.9/5 stars) on the homepage, which undermines trust and authenticity. Real customer reviews provide social proof, help potential customers make informed decisions, and give valuable feedback for continuous improvement.

## What Changes

- Add 5-star rating system tied to completed reservations
- Allow customers to submit optional text reviews after their event
- Implement admin approval workflow before publishing reviews
- Replace fake homepage ratings with calculated averages from real data
- Display published reviews on homepage and service pages
- Add review submission form accessible from reservation confirmation emails

## Capabilities

### New Capabilities
- `customer-ratings`: Customer rating and review system with 1-5 star ratings, optional text reviews, admin moderation, and public display

### Modified Capabilities
<!-- No existing capabilities are being modified at the requirements level -->

## Impact

**Database:**
- New `reviews` table with foreign key to `reservations`
- Indexes for efficient queries on published reviews

**API Endpoints:**
- `POST /api/reviews` - Submit review (authenticated customers only)
- `GET /api/reviews` - Fetch published reviews (public)
- `GET /api/reviews/stats` - Get aggregate rating data (public)
- `PATCH /api/reviews/[id]/publish` - Admin approval (admin only)

**UI Components:**
- Homepage Hero component (replace fake rating with real aggregate)
- Review submission form component
- Review display/card component
- Admin review moderation dashboard

**External Integrations:**
- n8n workflow update to include review submission link in confirmation emails
- Email templates for review requests and admin notifications
