import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCollaborativeEventById,
  getParticipantByUserId,
} from '@/utils/db/collaborative-events';
import type {
  CollaborativeEvent,
  CollaborativeEventParticipant,
} from '@/utils/db/collaborative-events';
import { requireAdminSession } from '@/utils/adminAuth';
import type { DecodedToken } from '@/utils/adminAuth';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface CollaborativeEventContext {
  userId: number;
  eventId: number;
  event: CollaborativeEvent;
  participant: CollaborativeEventParticipant | null;
  isOrganizer: boolean;
}

export type CollaborativeEventHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: CollaborativeEventContext,
) => Promise<void | NextApiResponse>;

export type AdminHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  admin: DecodedToken,
) => Promise<void | NextApiResponse>;

// ---------------------------------------------------------------------------
// Collaborative-event auth middleware
// ---------------------------------------------------------------------------

/**
 * Wraps an API handler with collaborative-event auth boilerplate:
 *  1. Validates the next-auth session
 *  2. Parses `req.query.id` as eventId
 *  3. Loads the event and participant
 *  4. Checks access (participant or organizer)
 *
 * The inner handler receives a `CollaborativeEventContext` with all resolved data.
 */
export function withCollaborativeEventAuth(handler: CollaborativeEventHandler): (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void | NextApiResponse> {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

    const userId = parseInt((session.user as any).id as string, 10);
    const eventId = parseIntParam(req.query.id);
    if (eventId === null) return res.status(400).json({ error: 'ID inválido' });

    const event = await getCollaborativeEventById(eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

    const participant = await getParticipantByUserId(eventId, userId);
    const isOrganizer = event.organizer_id === userId;
    if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

    return handler(req, res, { userId, eventId, event, participant, isOrganizer });
  };
}

// ---------------------------------------------------------------------------
// Admin handler wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps an API handler with admin-auth boilerplate:
 *  1. Calls `requireAdminSession`
 *  2. Catches `Unauthorized` errors and returns 401
 *  3. Catches any other error and returns 500 with a log
 *
 * @param logLabel - label for console.error (e.g. 'services')
 */
export function withAdminHandler(
  handler: AdminHandler,
  logLabel: string,
): (req: NextApiRequest, res: NextApiResponse) => Promise<void | NextApiResponse> {
  return async (req, res) => {
    try {
      const admin = await requireAdminSession(req, res);
      return await handler(req, res, admin);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      console.error(`Error in ${logLabel} API:`, error);
      return res.status(500).json({ success: false, error: 'Error interno' });
    }
  };
}

// ---------------------------------------------------------------------------
// Query-param parsing helpers
// ---------------------------------------------------------------------------

/**
 * Parse a query parameter as a positive integer; returns `null` on failure.
 */
export function parseIntParam(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Method guard
// ---------------------------------------------------------------------------

export function methodNotAllowed(res: NextApiResponse): void {
  res.status(405).json({ error: 'Method not allowed' });
}

// ---------------------------------------------------------------------------
// Dynamic SQL update builder
// ---------------------------------------------------------------------------

export interface DynamicUpdateResult {
  setClauses: string;
  params: unknown[];
  nextIndex: number;
}

/**
 * Build SET clauses for a dynamic UPDATE from an object of field -> value.
 * Only includes fields whose value is not `undefined`.
 *
 * @returns `null` if no fields to update.
 *
 * Usage:
 * ```ts
 * const upd = buildDynamicUpdate({ title: 'x', description: undefined }, 1);
 * // upd.setClauses  => "title = $1"
 * // upd.params      => ['x']
 * // upd.nextIndex   => 2
 * params.push(id);
 * await query(`UPDATE t SET ${upd.setClauses} WHERE id = $${upd.nextIndex}`, [...upd.params, id]);
 * ```
 */
export function buildDynamicUpdate(
  fields: Record<string, unknown>,
  startIndex: number = 1,
): DynamicUpdateResult | null {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let idx = startIndex;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      clauses.push(`${key} = $${idx++}`);
      params.push(value);
    }
  }

  if (clauses.length === 0) return null;

  return {
    setClauses: clauses.join(', '),
    params,
    nextIndex: idx,
  };
}

// ---------------------------------------------------------------------------
// n8n webhook notification helper
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget notification to the n8n webhook.
 * Catches and logs errors silently.
 *
 * @param path   - sub-path appended to N8N_WEBHOOK_URL (e.g. '/reservation-status-changed').
 *                 Pass empty string to post to the base URL.
 * @param payload - JSON body
 */
export async function notifyN8n(path: string, payload: Record<string, unknown>): Promise<void> {
  const baseUrl = process.env.N8N_WEBHOOK_URL;
  if (!baseUrl) return;

  const url = path ? `${baseUrl}${path}` : baseUrl;

  try {
    const { default: axios } = await import('axios');
    await axios.post(url, payload, { timeout: 5000 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('n8n notification failed:', message);
  }
}
