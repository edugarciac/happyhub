-- Registro persistente de intentos de login y reserva (forense).
-- También se aplica en tiempo de ejecución (ensureAuditTable en src/lib/audit.ts).
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,   -- auth.login | auth.google | auth.register | reservation.web | reservation.admin
  outcome VARCHAR(20) NOT NULL,      -- success | failure
  reason TEXT,
  email VARCHAR(255),
  user_id INTEGER,
  http_status INTEGER,
  ip VARCHAR(100),
  user_agent VARCHAR(500),
  request_id VARCHAR(200),
  detail JSONB
);
CREATE INDEX IF NOT EXISTS audit_events_email_idx ON audit_events (LOWER(email), created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events (created_at DESC);
