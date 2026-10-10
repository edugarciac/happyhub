-- Último pago con tarjeta rechazado (webhook payment_intent.payment_failed), visible en el panel admin
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS last_payment_error TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS last_payment_error_at TIMESTAMPTZ;
