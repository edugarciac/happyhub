-- Migration: Create holidays table for editable holiday-pricing calendar
-- HappyHub — admin-managed holiday list, seeded from the Esplugues de Llobregat
-- official 2026 municipal calendar. Also links blocked_slots to holidays so an
-- admin can block a holiday date instead of just pricing it differently.

CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  holiday_date DATE NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'custom', -- 'seed' | 'custom'
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);

CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE holidays IS 'Días festivos usados para aplicar precio de festivo. Editable desde /admin/holidays.';
COMMENT ON COLUMN holidays.source IS 'seed = precargado del calendario oficial de Esplugues de Llobregat, custom = añadido manualmente por el admin';
COMMENT ON COLUMN holidays.blocked IS 'Si true, el día está bloqueado para reservas (ver blocked_slots.holiday_id) en lugar de aplicarle precio de festivo';

-- Link blocked_slots rows created by toggling a holiday to "blocked" back to
-- their holiday, so unblocking (or deleting the holiday) can clean them up.
ALTER TABLE blocked_slots ADD COLUMN IF NOT EXISTS holiday_id INTEGER REFERENCES holidays(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_blocked_slots_holiday ON blocked_slots(holiday_id);

-- Seed: 2026 official holiday calendar for Esplugues de Llobregat
-- (12 Catalonia-wide holidays + 2 municipal local holidays approved by the
-- ajuntament's ple in June 2025). Sourced via web search cross-referencing
-- multiple secondary calendar sites — review against the ajuntament's
-- published calendar and correct/extend from /admin/holidays as needed.
INSERT INTO holidays (holiday_date, name, source) VALUES
  ('2026-01-01', 'Cap d''Any', 'seed'),
  ('2026-01-06', 'Reis', 'seed'),
  ('2026-04-03', 'Divendres Sant', 'seed'),
  ('2026-04-06', 'Dilluns de Pasqua Florida', 'seed'),
  ('2026-05-01', 'Festa del Treball', 'seed'),
  ('2026-05-25', 'Festa local (Esplugues de Llobregat)', 'seed'),
  ('2026-06-24', 'Sant Joan', 'seed'),
  ('2026-08-15', 'Assumpció', 'seed'),
  ('2026-09-11', 'Diada Nacional de Catalunya', 'seed'),
  ('2026-09-21', 'Festa local (Esplugues de Llobregat)', 'seed'),
  ('2026-10-12', 'Festa Nacional d''Espanya', 'seed'),
  ('2026-12-08', 'Immaculada Concepció', 'seed'),
  ('2026-12-25', 'Nadal', 'seed'),
  ('2026-12-26', 'Sant Esteve', 'seed')
ON CONFLICT (holiday_date) DO NOTHING;

-- DOWN MIGRATION (for rollback)
-- ALTER TABLE blocked_slots DROP COLUMN IF EXISTS holiday_id;
-- DROP TRIGGER IF EXISTS update_holidays_updated_at ON holidays;
-- DROP INDEX IF EXISTS idx_holidays_date;
-- DROP TABLE IF EXISTS holidays;
