import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    const id = parseInt(req.query.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    if (req.method === 'PATCH') {
      const { title, description, event_types, participant_types, tags, admin_notes } = req.body;
      if (!title?.trim()) return res.status(400).json({ success: false, error: 'El título es obligatorio' });

      const result = await query(
        `UPDATE activity_templates SET
           title = $1, description = $2, event_types = $3,
           participant_types = $4, tags = $5, admin_notes = $6
         WHERE id = $7 RETURNING *`,
        [
          title.trim(),
          description?.trim() || null,
          event_types || [],
          participant_types || [],
          tags || [],
          admin_notes?.trim() || null,
          id,
        ]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Template no encontrado' });
      return res.status(200).json({ success: true, template: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      const deleteResult = await query(`DELETE FROM activity_templates WHERE id = $1`, [id]);
      if (deleteResult.rowCount === 0) return res.status(404).json({ success: false, error: 'Template no encontrado' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in activity-templates/[id] API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
