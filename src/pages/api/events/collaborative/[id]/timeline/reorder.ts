import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

const reorderSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Sin permisos' });

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
}
