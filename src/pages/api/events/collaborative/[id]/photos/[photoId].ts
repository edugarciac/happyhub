// src/pages/api/events/collaborative/[id]/photos/[photoId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { deleteFromS3 } from '@/lib/s3';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const photoId = parseInt(req.query.photoId as string, 10);
  if (isNaN(eventId) || isNaN(photoId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const photo = await queryOne<{ id: number; url: string; uploaded_by_participant_id: number | null }>(
    `SELECT id, url, uploaded_by_participant_id FROM event_photos WHERE id = $1 AND event_id = $2`,
    [photoId, eventId]
  );
  if (!photo) return res.status(404).json({ error: 'Foto no encontrada' });

  const canDelete = isOrganizer || photo.uploaded_by_participant_id === participant?.id;
  if (!canDelete) return res.status(403).json({ error: 'Sin permiso para eliminar esta foto' });

  await query(`DELETE FROM event_photos WHERE id = $1`, [photoId]);
  try {
    await deleteFromS3(photo.url);
  } catch {
    // El registro ya se eliminó; un fallo al borrar el objeto S3 no debe bloquear la respuesta.
  }

  return res.status(204).end();
}
