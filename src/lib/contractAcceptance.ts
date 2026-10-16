import crypto from 'crypto';
import type { NextApiRequest } from 'next';
import { query, queryOne } from '@/lib/db';

/**
 * Prueba de aceptación electrónica de los términos y condiciones.
 * Esquema idéntico a database/migrations/026_contract_acceptances.sql (se aplica aquí de forma idempotente,
 * una vez por instancia, igual que ensureReservationFlowColumns).
 */

export const ACCEPTANCE_METHOD_WEB = 'web_checkbox_after_full_scroll';
export const TERMS_TEXT_MIN = 1000;
export const TERMS_TEXT_MAX = 200000;

let tableReady: Promise<void> | null = null;

export function ensureContractAcceptancesTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await query(`
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
        )`);
      await query('CREATE INDEX IF NOT EXISTS idx_contract_acceptances_reservation ON contract_acceptances(reservation_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_contract_acceptances_email ON contract_acceptances(LOWER(customer_email))');
      await query(`
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
        $$ LANGUAGE plpgsql`);
      await query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_acceptances_immutable') THEN
            CREATE TRIGGER trg_contract_acceptances_immutable
              BEFORE UPDATE OR DELETE ON contract_acceptances
              FOR EACH ROW EXECUTE FUNCTION contract_acceptances_immutable();
          END IF;
        END
        $$`);
    })().catch((err) => {
      tableReady = null; // reintentar en la siguiente petición
      throw err;
    });
  }
  return tableReady;
}

export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/** JSON con claves ordenadas, para que el hash de la prueba sea reproducible. */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(',')}}`;
}

export function getClientIp(req: NextApiRequest): string | null {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  if (first) return first.slice(0, 100);
  const real = req.headers['x-real-ip'];
  const realIp = Array.isArray(real) ? real[0] : real;
  if (realIp) return realIp.slice(0, 100);
  return req.socket?.remoteAddress?.slice(0, 100) || null;
}

function header(req: NextApiRequest, name: string, max: number): string | null {
  const v = req.headers[name];
  const s = Array.isArray(v) ? v[0] : v;
  return s ? s.slice(0, max) : null;
}

export interface AcceptanceInput {
  reservationId: number;
  reservationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  termsVersion: string;
  termsText: string;
  scrolledToEnd: boolean;
  contractSnapshot: Record<string, unknown>;
}

export interface StoredAcceptance {
  id: number;
  accepted_at: string;
  terms_version: string;
  terms_sha256: string;
  evidence_sha256: string;
}

/** Guarda la prueba. Lanza si no se puede guardar (el llamante debe anular la reserva). */
export async function recordContractAcceptance(req: NextApiRequest, input: AcceptanceInput): Promise<StoredAcceptance> {
  await ensureContractAcceptancesTable();

  // Hora del servidor, fijada aquí para que forme parte del hash de la prueba.
  const now = await queryOne<{ now: string }>("SELECT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS now");
  const acceptedAt = now?.now || new Date().toISOString();

  const evidence = {
    reservationId: input.reservationId,
    reservationCode: input.reservationCode,
    acceptedAt,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    termsVersion: input.termsVersion,
    termsSha256: sha256(input.termsText),
    appCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    contractSnapshot: input.contractSnapshot,
    acceptanceMethod: ACCEPTANCE_METHOD_WEB,
    scrolledToEnd: input.scrolledToEnd,
    ipAddress: getClientIp(req),
    userAgent: header(req, 'user-agent', 1000),
    acceptLanguage: header(req, 'accept-language', 255),
  };
  const evidenceSha256 = sha256(canonicalJson(evidence));

  const row = await queryOne<StoredAcceptance>(
    `INSERT INTO contract_acceptances
       (reservation_id, reservation_code, accepted_at, customer_name, customer_email, customer_phone,
        terms_version, terms_text, terms_sha256, app_commit_sha, contract_snapshot, acceptance_method,
        scrolled_to_end, ip_address, user_agent, accept_language, evidence_sha256)
     VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, $16, $17)
     RETURNING id, accepted_at, terms_version, terms_sha256, evidence_sha256`,
    [
      evidence.reservationId,
      evidence.reservationCode,
      acceptedAt,
      evidence.customerName,
      evidence.customerEmail,
      evidence.customerPhone,
      evidence.termsVersion,
      input.termsText,
      evidence.termsSha256,
      evidence.appCommitSha,
      JSON.stringify(evidence.contractSnapshot),
      evidence.acceptanceMethod,
      evidence.scrolledToEnd,
      evidence.ipAddress,
      evidence.userAgent,
      evidence.acceptLanguage,
      evidenceSha256,
    ]
  );
  if (!row) throw new Error('No se pudo guardar la prueba de aceptación');
  return row;
}

export async function markConfirmationEmailSent(acceptanceId: number): Promise<void> {
  await query(
    'UPDATE contract_acceptances SET confirmation_email_sent_at = NOW() WHERE id = $1 AND confirmation_email_sent_at IS NULL',
    [acceptanceId]
  );
}

/** Prueba de aceptación más reciente de una reserva, o null (también si la tabla aún no existe). */
export async function getContractAcceptance(reservationId: number) {
  try {
    await ensureContractAcceptancesTable();
    return await queryOne(
      `SELECT id, reservation_code, accepted_at, customer_name, customer_email, customer_phone, terms_version,
              terms_sha256, app_commit_sha, acceptance_method, scrolled_to_end, ip_address, user_agent,
              accept_language, evidence_sha256, confirmation_email_sent_at
       FROM contract_acceptances WHERE reservation_id = $1 ORDER BY id DESC LIMIT 1`,
      [reservationId]
    );
  } catch (err) {
    console.error('Error leyendo la prueba de aceptación:', err);
    return null;
  }
}
