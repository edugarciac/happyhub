-- Recordatorio del pago del resto 3 días antes del evento.
-- También se aplica en tiempo de ejecución (ensureReservationFlowColumns).
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS remaining_reminder_sent_at TIMESTAMPTZ;
