import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  ensureCollaborativeEventsSchema,
  createCollaborativeEvent,
  getEventsByOrganizer,
  getEventsByParticipant,
} from '@/utils/db/collaborative-events';
import { getUserById } from '@/utils/db/users';

const createSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  event_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  location: z.string().max(500).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureCollaborativeEventsSchema();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'Sesión inválida' });

  if (req.method === 'GET') {
    const organized = await getEventsByOrganizer(userId);
    const participating = await getEventsByParticipant(userId);
    return res.status(200).json({ organized, participating });
  }

  if (req.method === 'POST') {
    const result = createSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: result.error.flatten() });
    }

    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const event = await createCollaborativeEvent({
      organizer_id: userId,
      organizer_name: user.name || user.email,
      organizer_email: user.email,
      ...result.data,
    });

    return res.status(201).json(event);
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
