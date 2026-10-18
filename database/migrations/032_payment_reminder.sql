-- Recordatorio de la señal a las 24 h; la cancelación pasa a 24 h después del recordatorio.
-- También se aplica en tiempo de ejecución (ensureReservationFlowColumns).
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMPTZ;
