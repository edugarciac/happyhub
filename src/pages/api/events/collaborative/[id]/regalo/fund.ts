import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

const fundSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional().nullable(),
  goal_amount: z.number().positive().optional().nullable(),
  current_amount: z.number().min(0).optional().nullable(),
  payment_link: z.string().url().max(500).optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) {
    return res.status(403).json({ error: 'Solo el organizador puede gestionar la colecta' });
  }

  if (req.method === 'PUT') {
    const parsed = fundSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, description, goal_amount, current_amount, payment_link } = parsed.data;

    const result = await query(
      `INSERT INTO event_gift_fund (event_id, title, description, goal_amount, current_amount, payment_link)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (event_id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         goal_amount = EXCLUDED.goal_amount,
         current_amount = EXCLUDED.current_amount,
         payment_link = EXCLUDED.payment_link,
         updated_at = NOW()
       RETURNING *`,
      [eventId, title, description ?? null, goal_amount ?? null, current_amount ?? 0, payment_link ?? null]
    );
    return res.status(200).json({ fund: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM event_gift_fund WHERE event_id = $1`, [eventId]);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
