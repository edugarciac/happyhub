-- Cobros adicionales de una reserva (extensión de horario, servicios, día completo, otros)
-- con enlace de pago propio. No cambian total_price ni deposit_paid.
-- También se aplica en tiempo de ejecución (ensureReservationChargesTable).
CREATE TABLE IF NOT EXISTS reservation_charges (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  concept VARCHAR(20) NOT NULL,
  hours INTEGER,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  stripe_session_id VARCHAR(255),
  paid_method VARCHAR(20),
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reservation_charges_reservation ON reservation_charges(reservation_id);
