-- Aviso el día antes del evento: pagar el resto y bloquear la fianza antes de empezar.
-- También se aplica en tiempo de ejecución (ensureReservationFlowColumns).
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS day_before_reminder_sent_at TIMESTAMPTZ;
