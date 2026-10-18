import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

// Registro persistente de intentos de login y reserva, para poder reconstruir
// después qué le pasó a un cliente (Vercel Hobby solo guarda 1 hora de logs).
// Nunca debe romper la petición que audita.

export type AuditEventType = 'auth.login' | 'auth.google' | 'auth.register' | 'reservation.web' | 'reservation.admin';

export interface AuditEvent {
  eventType: AuditEventType;
  outcome: 'success' | 'failure';
  reason?: string | null;
  email?: string | null;
  userId?: number | null;
  httpStatus?: number | null;
  detail?: Record<string, unknown>;
}

type Headers = Record<string, string | string[] | undefined>;

// Aplica la migración 030 de forma idempotente, una vez por instancia
let tableReady: Promise<void> | null = null;
function ensureAuditTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await query(`CREATE TABLE IF NOT EXISTS audit_events (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        event_type VARCHAR(50) NOT NULL,
        outcome VARCHAR(20) NOT NULL,
        reason TEXT,
        email VARCHAR(255),
        user_id INTEGER,
        http_status INTEGER,
        ip VARCHAR(100),
        user_agent VARCHAR(500),
        request_id VARCHAR(200),
        detail JSONB
      )`);
      await query('CREATE INDEX IF NOT EXISTS audit_events_email_idx ON audit_events (LOWER(email), created_at DESC)');
      await query('CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events (created_at DESC)');
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

function header(headers: Headers | undefined, name: string, max: number): string | null {
  const v = headers?.[name];
  const s = Array.isArray(v) ? v[0] : v;
  return s ? String(s).slice(0, max) : null;
}

function clientIp(headers: Headers | undefined): string | null {
  return header(headers, 'x-forwarded-for', 300)?.split(',')[0]?.trim().slice(0, 100) || header(headers, 'x-real-ip', 100);
}

/** Campos que nunca se guardan en el detalle */
const SECRET_KEYS = new Set(['password', 'confirmPassword', 'termsText', 'token', 'csrfToken']);

/** Copia del cuerpo de la petición sin secretos ni textos largos */
export function sanitizeBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SECRET_KEYS.has(key)) continue;
    out[key] = typeof value === 'string' && value.length > 300 ? `${value.slice(0, 300)}…` : value;
  }
  return out;
}

export async function recordAuditEvent(headers: Headers | undefined, event: AuditEvent): Promise<void> {
  const row = {
    ...event,
    email: event.email?.trim().toLowerCase().slice(0, 255) || null,
    ip: clientIp(headers),
    userAgent: header(headers, 'user-agent', 500),
    requestId: header(headers, 'x-vercel-id', 200),
  };
  console.log('[AUDIT]', JSON.stringify({ ...row, detail: undefined }));
  try {
    await ensureAuditTable();
    await query(
      `INSERT INTO audit_events (event_type, outcome, reason, email, user_id, http_status, ip, user_agent, request_id, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        row.eventType,
        row.outcome,
        row.reason?.slice(0, 2000) || null,
        row.email,
        row.userId ?? null,
        row.httpStatus ?? null,
        row.ip,
        row.userAgent,
        row.requestId,
        JSON.stringify(row.detail || {}),
      ]
    );
  } catch (err: any) {
    console.error('[AUDIT] No se pudo guardar el evento:', err?.message || err);
  }
}

/**
 * Envuelve una API para auditar cada llamada: guarda el estado HTTP y el
 * `step`/`error` de la respuesta. La respuesta se envía después de guardar el
 * evento, porque Vercel congela la función en cuanto se responde.
 */
export function withAudit(eventType: AuditEventType, handler: NextApiHandler, options: { methods?: string[] } = {}): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (options.methods && !options.methods.includes(req.method || '')) return handler(req, res);

    const sendJson = res.json.bind(res);
    let captured: { body: any } | null = null;
    res.json = ((body: any) => {
      captured = { body };
      return res;
    }) as typeof res.json;

    let thrown: unknown = null;
    try {
      await handler(req, res);
    } catch (err) {
      thrown = err;
    }

    const body = (captured as { body: any } | null)?.body;
    const status = thrown ? 500 : res.statusCode;
    await recordAuditEvent(req.headers, {
      eventType,
      outcome: status < 400 ? 'success' : 'failure',
      reason: thrown ? String((thrown as Error)?.message || thrown) : body?.step || (status >= 400 ? body?.error : null) || null,
      email: typeof req.body?.email === 'string' ? req.body.email : null,
      httpStatus: status,
      detail: {
        request: sanitizeBody(req.body),
        response: body && typeof body === 'object' ? { error: body.error, detail: body.detail, step: body.step, reservationId: body.reservationId ?? body.id } : undefined,
      },
    });

    res.json = sendJson;
    if (thrown) throw thrown;
    if (captured) sendJson((captured as { body: any }).body);
  };
}
