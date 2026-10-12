-- Migration: Update pricing grid (October 2026)
-- Date: 2026-10-12
-- Description: New prices. Holidays and holiday eves are now "A consultar" (price 0)
-- for both slots; the eve logic lives in src/utils/pricing.ts (getPricingRuleKey).

-- UP MIGRATION
UPDATE pricing_rules SET price = 120.00, description = 'Lunes a Viernes - Mañana' WHERE rule_name = 'weekday_morning';
UPDATE pricing_rules SET price = 130.00, description = 'Lunes a Jueves - Tarde' WHERE rule_name = 'weekday_afternoon';
UPDATE pricing_rules SET price = 180.00, description = 'Viernes - Tarde' WHERE rule_name = 'friday_afternoon';
UPDATE pricing_rules SET price = 160.00, description = 'Sábados y Domingos - Mañana' WHERE rule_name = 'weekend_morning';
UPDATE pricing_rules SET price = 200.00, description = 'Sábados y Domingos - Tarde' WHERE rule_name = 'weekend_afternoon';
UPDATE pricing_rules SET price = 0.00, description = 'Festivos y Vísperas - Mañana (a consultar)' WHERE rule_name = 'holiday_morning';
UPDATE pricing_rules SET price = 0.00, description = 'Festivos y Vísperas - Tarde (a consultar)' WHERE rule_name = 'holiday_afternoon';

-- DOWN MIGRATION (for rollback)
-- UPDATE pricing_rules SET price = 110.00 WHERE rule_name IN ('weekday_morning', 'weekday_afternoon');
-- UPDATE pricing_rules SET price = 155.00 WHERE rule_name = 'friday_afternoon';
-- UPDATE pricing_rules SET price = 145.00 WHERE rule_name IN ('weekend_morning', 'holiday_morning');
-- UPDATE pricing_rules SET price = 185.00 WHERE rule_name IN ('weekend_afternoon', 'holiday_afternoon');
