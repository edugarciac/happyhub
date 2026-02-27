-- Migration: Create pricing_rules table for dynamic pricing
-- Date: 2026-02-28
-- Description: Move pricing from hardcoded logic to database for admin flexibility

-- UP MIGRATION
CREATE TABLE IF NOT EXISTS pricing_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  day_type VARCHAR(50) NOT NULL, -- 'weekday', 'friday', 'weekend', 'holiday'
  time_slot VARCHAR(20) NOT NULL, -- 'morning', 'afternoon', 'night'
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  effective_from DATE,
  effective_to DATE,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_day_slot UNIQUE (day_type, time_slot, effective_from)
);

-- Create index for active pricing queries
CREATE INDEX idx_pricing_active ON pricing_rules(active, effective_from, effective_to);

-- Add trigger for automatic updated_at
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing_rules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert current pricing rules (from CLAUDE.md business rules)
INSERT INTO pricing_rules (rule_name, day_type, time_slot, price, description) VALUES
('weekday_morning', 'weekday', 'morning', 110.00, 'Lunes a Viernes - Mañana'),
('weekday_afternoon', 'weekday', 'afternoon', 110.00, 'Lunes a Jueves - Tarde'),
('friday_afternoon', 'friday', 'afternoon', 155.00, 'Viernes y Vísperas de festivos - Tarde'),
('weekend_morning', 'weekend', 'morning', 145.00, 'Sábados, Domingos y festivos - Mañana'),
('weekend_afternoon', 'weekend', 'afternoon', 185.00, 'Sábados, Domingos y festivos - Tarde'),
('holiday_morning', 'holiday', 'morning', 145.00, 'Festivos - Mañana'),
('holiday_afternoon', 'holiday', 'afternoon', 185.00, 'Festivos - Tarde'),
('night_consult', 'weekday', 'night', 0.00, 'Nocturno - A consultar'),
('night_consult_weekend', 'weekend', 'night', 0.00, 'Nocturno fin de semana - A consultar');

-- Comments
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules for space rental. Admin can modify without code deployment.';
COMMENT ON COLUMN pricing_rules.day_type IS 'Type of day: weekday, friday, weekend, holiday';
COMMENT ON COLUMN pricing_rules.time_slot IS 'Time slot: morning, afternoon, night';
COMMENT ON COLUMN pricing_rules.price IS 'Price in euros. 0 means consultation required.';
COMMENT ON COLUMN pricing_rules.active IS 'Whether this rule is currently active. Allows disabling without deletion.';
COMMENT ON COLUMN pricing_rules.effective_from IS 'Start date for this pricing (optional, for seasonal pricing)';
COMMENT ON COLUMN pricing_rules.effective_to IS 'End date for this pricing (optional)';

-- DOWN MIGRATION (for rollback)
-- Uncomment below to rollback:
-- DROP TRIGGER IF EXISTS update_pricing_updated_at ON pricing_rules;
-- DROP INDEX IF EXISTS idx_pricing_active;
-- DROP TABLE IF EXISTS pricing_rules;
