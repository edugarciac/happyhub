import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    if (req.method === 'GET') {
      const result = await query(
        `SELECT * FROM activity_templates ORDER BY usage_count DESC, created_at DESC`
      );
      return res.status(200).json({ success: true, templates: result.rows });
    }

    if (req.method === 'POST') {
      const { title, description, event_types, participant_types, tags, admin_notes } = req.body;
      if (!title?.trim()) return res.status(400).json({ success: false, error: 'El título es obligatorio' });

      const result = await query(
        `INSERT INTO activity_templates (title, description, event_types, participant_types, tags, admin_notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          title.trim(),
          description?.trim() || null,
          event_types || [],
          participant_types || [],
          tags || [],
          admin_notes?.trim() || null,
        ]
      );
      return res.status(201).json({ success: true, template: result.rows[0] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in activity-templates API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
