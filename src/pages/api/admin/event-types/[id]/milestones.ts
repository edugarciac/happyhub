// src/pages/api/admin/event-types/[id]/milestones.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminSession } from '@/utils/adminAuth';
import { query } from '@/lib/db';
import { getMilestonesByEventTypeName } from '@/utils/db/event-templates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await verifyAdminSession(req, res);
  if (!admin) return res.status(401).json({ error: 'No autorizado' });

  const eventTypeId = parseInt(req.query.id as string, 10);
  if (isNaN(eventTypeId)) return res.status(400).json({ error: 'ID inválido' });

  const typeResult = await query<{ name: string }>(
    `SELECT name FROM event_types WHERE id = $1`,
    [eventTypeId]
  );
  if (!typeResult.rows.length) return res.status(404).json({ error: 'Tipo no encontrado' });

  const milestones = await getMilestonesByEventTypeName(typeResult.rows[0].name);
  return res.status(200).json({ milestones });
}
