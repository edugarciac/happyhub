-- HappyHub Database Schema for AWS Aurora PostgreSQL
-- Account: happyhub.rovellat@gmail.com

-- Create database
CREATE DATABASE IF NOT EXISTS happyhub_db;

-- Tabla de reservas/solicitudes de eventos
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,

  -- Información del cliente
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,

  -- Detalles del evento
  event_type VARCHAR(50) NOT NULL,  -- cumpleaños, comunion, bautizo, otro
  event_date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL,   -- morning, afternoon, night
  guests INT NOT NULL CHECK (guests >= 1 AND guests <= 150),

  -- Servicios y precio
  extras JSONB DEFAULT '[]',         -- Array de servicios adicionales
  base_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2),

  -- Método de pago
  payment_method VARCHAR(20) NOT NULL,  -- card, bizum, cash

  -- Estado de la reserva
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, confirmed, cancelled

  -- Comentarios y mensajes
  customer_message TEXT,
  admin_comments TEXT,
  rejection_reason TEXT,

  -- Google Calendar integration
  google_calendar_event_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  confirmed_at TIMESTAMP,

  -- Índices para búsquedas rápidas
  CONSTRAINT unique_slot UNIQUE (event_date, time_slot)
);

-- Índices para optimizar consultas
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_date ON reservations(event_date);
CREATE INDEX idx_reservations_email ON reservations(email);
CREATE INDEX idx_reservations_created_at ON reservations(created_at DESC);

-- Tabla de historial de cambios de estado
CREATE TABLE IF NOT EXISTS reservation_status_history (
  id SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by VARCHAR(255),  -- email del admin que hizo el cambio
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_reservation ON reservation_status_history(reservation_id);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_type VARCHAR(20) NOT NULL,  -- deposit, full_payment, balance
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, completed, failed, refunded
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (reservation_id, payment_type)
);

CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuraciones iniciales
INSERT INTO settings (key, value, description) VALUES
('google_calendar_id', 'happyhub.rovellat@gmail.com', 'Google Calendar ID para sincronización'),
('approval_email', 'happyhub.rovellat@gmail.com', 'Email para notificaciones de aprobación'),
('business_name', 'HappyHub', 'Nombre del negocio'),
('business_phone', '638390600', 'Teléfono de contacto'),
('business_email', 'happyhub.rovellat@gmail.com', 'Email de contacto'),
('business_address', 'C/ Rovellat, 25, 08950 Esplugues de Llobregat, Barcelona', 'Dirección del local')
ON CONFLICT (key) DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en reservations
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en settings
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista para el listado de reservas con información completa
CREATE OR REPLACE VIEW reservations_full AS
SELECT
  r.*,
  p.amount as deposit_amount,
  p.status as payment_status,
  p.paid_at as payment_date,
  CASE
    WHEN r.status = 'pending' THEN 0
    WHEN r.status = 'approved' THEN 1
    WHEN r.status = 'confirmed' THEN 2
    WHEN r.status = 'rejected' THEN -1
    WHEN r.status = 'cancelled' THEN -2
  END as status_priority
FROM reservations r
LEFT JOIN payments p ON r.id = p.reservation_id AND p.payment_type = 'deposit'
ORDER BY r.created_at DESC;

-- Comentarios para documentación
COMMENT ON TABLE reservations IS 'Tabla principal de reservas y solicitudes de eventos';
COMMENT ON COLUMN reservations.status IS 'Estados: pending (inicial), approved (aprobado por admin), rejected (rechazado), confirmed (pago recibido), cancelled (cancelado)';
COMMENT ON COLUMN reservations.time_slot IS 'Franjas horarias: morning (11:00-14:30), afternoon (16:30-20:30), night (22:00-02:00)';
COMMENT ON COLUMN reservations.google_calendar_event_id IS 'ID del evento en Google Calendar, se crea tras la aprobación';
