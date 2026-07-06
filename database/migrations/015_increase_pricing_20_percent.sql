-- Migration: Increase all pricing_rules prices by 20%
-- Date: 2026-07-06
-- Description: Business-driven price increase across all time slots.
--              See openspec/changes/pricing-rate-increase for context.

-- UP MIGRATION
UPDATE pricing_rules
SET price = ROUND(price * 1.20, 2);

-- DOWN MIGRATION (for rollback)
-- Uncomment below to revert the 20% increase:
-- UPDATE pricing_rules SET price = ROUND(price / 1.20, 2);
