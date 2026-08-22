// src/pages/api/events/collaborative/[id]/regalo/index.ts
import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId } = ctx;

  const [itemsResult, fundResult] = await Promise.all([
    query(`SELECT * FROM event_gift_items WHERE event_id = $1 ORDER BY created_at ASC`, [eventId]),
    query(`SELECT * FROM event_gift_fund WHERE event_id = $1`, [eventId]),
  ]);

  return res.status(200).json({
    items: itemsResult.rows,
    fund: fundResult.rows[0] || null,
  });
});
