## Why

Pricing logic is currently hardcoded in src/utils/pricing.ts, making it impossible for admin to adjust prices without code deployment. Business needs flexibility to change prices based on demand, seasons, or promotions. Additionally, reviews summary (total count + average rating) should be prominently displayed for social proof.

## What Changes

- Create pricing_rules table in database with day types, time slots, and prices
- Migrate calculateBasePrice() to query database instead of hardcoded values
- Add admin CRUD page for managing pricing rules at /admin/pricing
- Replace hardcoded prices in all components with database queries
- Add ReviewsSummary component showing total reviews and average rating
- Display reviews summary on homepage prominently (above fold, near Hero)

## Capabilities

### New Capabilities
- `pricing-database`: Store pricing rules in database with day_type, time_slot, price fields
- `admin-pricing-management`: Admin interface to create, update, delete pricing rules
- `reviews-summary-display`: Prominent display of aggregate review stats on homepage

### Modified Capabilities
<!-- No existing capabilities modified at requirements level -->

## Impact

**Database:**
- New table: pricing_rules (day_type, time_slot, price, effective_from, effective_to)
- Examples: {"weekday_morning": 110, "weekend_afternoon": 185, "friday_afternoon": 155}

**Code Changes:**
- src/utils/pricing.ts - Query database instead of hardcoded rules
- src/components/PricingTable.tsx - Fetch prices from API
- src/pages/disponibilidad.tsx - Use database prices
- src/pages/api/pricing.ts - New endpoint for getting current prices
- All reservation forms - Use API prices

**New Pages:**
- /admin/pricing - Pricing management CRUD interface

**New API Endpoints:**
- GET /api/pricing/current - Get current active pricing rules
- GET /api/admin/pricing - Admin list all pricing rules
- POST /api/admin/pricing - Create new pricing rule
- PATCH /api/admin/pricing/[id] - Update pricing rule
- DELETE /api/admin/pricing/[id] - Delete pricing rule

**UI Components:**
- src/components/ReviewsSummary.tsx - Display aggregate stats with stars and count
- Update Hero.tsx to include ReviewsSummary component
