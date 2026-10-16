-- Prueba de aceptación electrónica de los términos y condiciones (LSSI arts. 23-28).
-- Se aplica también de forma idempotente en tiempo de ejecución (src/lib/contractAcceptance.ts).
-- Sin clave foránea a reservations: la prueba debe sobrevivir al borrado o edición de la reserva.

CREATE TABLE IF NOT EXISTS contract_acceptances (
  id                         SERIAL PRIMARY KEY,
  reservation_id             INTEGER NOT NULL,
  reservation_code           VARCHAR(50),
  accepted_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_name              VARCHAR(255) NOT NULL,
  customer_email             VARCHAR(255) NOT NULL,
  customer_phone             VARCHAR(50),
  terms_version              VARCHAR(100) NOT NULL,
  terms_text                 TEXT NOT NULL,
  terms_sha256               CHAR(64) NOT NULL,
  app_commit_sha             VARCHAR(64),
  contract_snapshot          JSONB NOT NULL,
  acceptance_method          VARCHAR(50) NOT NULL,
  scrolled_to_end            BOOLEAN NOT NULL DEFAULT false,
  ip_address                 VARCHAR(100),
  user_agent                 TEXT,
  accept_language            VARCHAR(255),
  evidence_sha256            CHAR(64) NOT NULL,
  confirmation_email_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_reservation ON contract_acceptances(reservation_id);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_email ON contract_acceptances(LOWER(customer_email));

-- Inmutabilidad: no se puede borrar; solo se puede rellenar confirmation_email_sent_at una vez.
CREATE OR REPLACE FUNCTION contract_acceptances_immutable() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'contract_acceptances es inmutable: no se puede borrar la prueba de aceptación';
  END IF;
  IF OLD.confirmation_email_sent_at IS NOT NULL
     OR (NEW.id, NEW.reservation_id, NEW.reservation_code, NEW.accepted_at, NEW.customer_name, NEW.customer_email,
         NEW.customer_phone, NEW.terms_version, NEW.terms_text, NEW.terms_sha256, NEW.app_commit_sha,
         NEW.contract_snapshot, NEW.acceptance_method, NEW.scrolled_to_end, NEW.ip_address, NEW.user_agent,
         NEW.accept_language, NEW.evidence_sha256)
        IS DISTINCT FROM
        (OLD.id, OLD.reservation_id, OLD.reservation_code, OLD.accepted_at, OLD.customer_name, OLD.customer_email,
         OLD.customer_phone, OLD.terms_version, OLD.terms_text, OLD.terms_sha256, OLD.app_commit_sha,
         OLD.contract_snapshot, OLD.acceptance_method, OLD.scrolled_to_end, OLD.ip_address, OLD.user_agent,
         OLD.accept_language, OLD.evidence_sha256)
  THEN
    RAISE EXCEPTION 'contract_acceptances es inmutable: solo se puede registrar el envío del email de confirmación';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contract_acceptances_immutable ON contract_acceptances;
CREATE TRIGGER trg_contract_acceptances_immutable
  BEFORE UPDATE OR DELETE ON contract_acceptances
  FOR EACH ROW EXECUTE FUNCTION contract_acceptances_immutable();
