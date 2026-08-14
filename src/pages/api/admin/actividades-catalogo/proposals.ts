import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';

    const result = await query(
      `SELECT p.id, p.title, p.description, p.status, p.created_at,
              e.title AS event_title,
              part.name AS proposed_by_name
       FROM activity_catalog_proposals p
       JOIN collaborative_events e ON e.id = p.event_id
       LEFT JOIN collaborative_event_participants part ON part.id = p.proposed_by_participant_id
       WHERE p.status = $1
       ORDER BY p.created_at ASC`,
      [status]
    );

    return res.status(200).json({ success: true, proposals: result.rows });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in actividades-catalogo/proposals API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
