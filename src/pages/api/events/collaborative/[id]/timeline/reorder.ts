import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { z } from 'zod';
import { query } from '@/lib/db';

const reorderSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, isOrganizer } = ctx;
  if (!isOrganizer) return res.status(403).json({ error: 'Sin permisos' });

  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { orderedIds } = parsed.data;

  await Promise.all(
    orderedIds.map((id, index) =>
      query(
        `UPDATE collaborative_event_timeline SET sort_order = $1 WHERE id = $2 AND event_id = $3`,
        [index, id, eventId]
      )
    )
  );

  return res.status(200).json({ reordered: true });
});
