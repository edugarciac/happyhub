-- Horas adicionales de la franja de tarde (20:00 → 23:00, 60 €/hora).
-- También se aplica en tiempo de ejecución (ensureReservationFlowColumns).
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS extra_hours INTEGER NOT NULL DEFAULT 0;
