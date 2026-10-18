-- Servicios adicionales de la reserva: [{id, title, price}] tal como se contrataron.
-- También se aplica en tiempo de ejecución (ensureReservationFlowColumns).
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS extras JSONB NOT NULL DEFAULT '[]'::jsonb;
