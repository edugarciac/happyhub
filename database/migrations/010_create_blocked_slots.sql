-- Migration: Create blocked_slots table
-- HappyHub — blocked dates management (admin)

CREATE TABLE IF NOT EXISTS blocked_slots (
  id SERIAL PRIMARY KEY,
  slot_date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL,          -- 'morning' | 'afternoon' | 'night'
  reason TEXT,
  created_by VARCHAR(255),                  -- email del admin que creó el bloqueo
  google_calendar_event_id VARCHAR(255),    -- ID del evento en Google Calendar (nullable)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_blocked_slot UNIQUE (slot_date, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(slot_date);

-- Trigger para updated_at automático
CREATE TRIGGER update_blocked_slots_updated_at
  BEFORE UPDATE ON blocked_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE blocked_slots IS 'Fechas y franjas bloqueadas por el admin (mantenimiento, uso interno, etc.)';
COMMENT ON COLUMN blocked_slots.time_slot IS 'morning (11:00-14:30) | afternoon (16:30-20:30) | night (22:00-02:00)';
COMMENT ON COLUMN blocked_slots.google_calendar_event_id IS 'ID del evento creado en Google Calendar al bloquear. Null si GCal falló o no está configurado.';
