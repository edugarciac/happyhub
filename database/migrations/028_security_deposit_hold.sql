-- Cobro del resto el día del evento y fianza por preautorización en tarjeta (150 €).
-- También se aplica en tiempo de ejecución (ensureReservationFlowColumns).
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS remaining_payment_method VARCHAR(20);          -- card_link | terminal
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_status VARCHAR(20) DEFAULT 'none'; -- none | held | released | captured | expired
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_method VARCHAR(20);           -- card_link | terminal
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_payment_intent VARCHAR(255);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_amount_held DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_held_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_expires_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_captured DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_resolved_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS security_deposit_note TEXT;
