-- database/migrations/011_event_dashboard.sql

-- Extender collaborative_event_timeline con campos del dashboard
ALTER TABLE collaborative_event_timeline
  ADD COLUMN IF NOT EXISTS phase VARCHAR(20) NOT NULL DEFAULT 'during',
  ADD COLUMN IF NOT EXISTS emoji VARCHAR(10),
  ADD COLUMN IF NOT EXISTS hito_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS detail_data JSONB,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Plantillas de evento (admin)
CREATE TABLE IF NOT EXISTS event_templates (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hitos por defecto de cada plantilla
CREATE TABLE IF NOT EXISTS event_template_milestones (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  emoji VARCHAR(10),
  title VARCHAR(255) NOT NULL,
  hito_type VARCHAR(50) NOT NULL,
  phase VARCHAR(20) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_template_milestones_template ON event_template_milestones(template_id);
