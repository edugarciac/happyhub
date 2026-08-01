// src/pages/api/events/collaborative/[id]/regalo/items.ts
import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { z } from 'zod';
import { query } from '@/lib/db';

const addItemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional().nullable(),
  url: z.string().url().max(500).optional().nullable(),
  price_approx: z.number().positive().optional().nullable(),
  emoji: z.string().max(10).optional().nullable(),
});

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, participant } = ctx;

  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, url, price_approx, emoji } = parsed.data;

  const result = await query(
    `INSERT INTO event_gift_items (event_id, title, description, url, price_approx, emoji, added_by_participant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [eventId, title, description ?? null, url ?? null, price_approx ?? null, emoji ?? null, participant?.id ?? null]
  );

  return res.status(201).json({ item: result.rows[0] });
});
