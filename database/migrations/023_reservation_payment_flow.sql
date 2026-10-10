-- Migration: approval-then-payment flow (openspec/changes/approval-then-payment-flow)
-- Método de pago elegido por el cliente y plazo para pagar la señal tras la aprobación.
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_due_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS payment_tokens (
  id             SERIAL PRIMARY KEY,
  token          VARCHAR(64) UNIQUE NOT NULL,
  reservation_id INTEGER NOT NULL,
  token_type     VARCHAR(30) NOT NULL DEFAULT 'remaining_payment',  -- 'deposit' | 'remaining_payment'
  expires_at     TIMESTAMP NOT NULL,
  used           BOOLEAN DEFAULT false,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_reservation ON payment_tokens(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_due ON reservations(payment_due_at) WHERE status = 'approved';
