import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth, methodNotAllowed } from '@/lib/apiMiddleware';
import { z } from 'zod';
import { query } from '@/lib/db';
import { ensureCollaborativeEventsSchema } from '@/utils/db/collaborative-events';

const addSchema = z.object({
  title: z.string().min(1).max(255),
  emoji: z.string().max(10).optional().nullable(),
  hito_type: z.string().max(50),
  phase: z.enum(['before', 'during', 'after']),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  detail_data: z.record(z.any()).optional().nullable(),
  sort_order: z.number().int().optional(),
});

export default async function handler(req: import('next').NextApiRequest, res: import('next').NextApiResponse) {
  await ensureCollaborativeEventsSchema();
  return withCollaborativeEventAuth(async (_req, _res, ctx) => {
    const { eventId, isOrganizer } = ctx;

    if (_req.method === 'GET') {
      const result = await query(
        `SELECT * FROM collaborative_event_timeline WHERE event_id = $1 ORDER BY
          CASE phase WHEN 'before' THEN 0 WHEN 'during' THEN 1 WHEN 'after' THEN 2 ELSE 3 END,
          sort_order, time`,
        [eventId]
      );
      return _res.status(200).json({ milestones: result.rows });
    }

    if (_req.method === 'POST') {
      if (!isOrganizer) return _res.status(403).json({ error: 'Solo el organizador puede añadir hitos' });

      const parsed = addSchema.safeParse(_req.body);
      if (!parsed.success) return _res.status(400).json({ error: parsed.error.flatten() });

      const { title, emoji, hito_type, phase, time, description, detail_data, sort_order } = parsed.data;

      const maxOrder = await query(
        `SELECT COALESCE(MAX(sort_order), -1) as max FROM collaborative_event_timeline WHERE event_id = $1 AND phase = $2`,
        [eventId, phase]
      );
      const nextOrder = sort_order ?? (maxOrder.rows[0].max + 1);

      const result = await query(
        `INSERT INTO collaborative_event_timeline
           (event_id, title, emoji, hito_type, phase, time, description, detail_data, sort_order, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
         RETURNING *`,
        [eventId, title, emoji ?? null, hito_type, phase, time ?? null, description ?? null,
         detail_data ? JSON.stringify(detail_data) : null, nextOrder]
      );
      return _res.status(201).json({ milestone: result.rows[0] });
    }

    return methodNotAllowed(_res);
  })(req, res);
}
