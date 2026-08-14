import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    const id = parseInt(req.query.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    if (req.method === 'PATCH') {
      const { title, description, event_type_ids, participant_types, tags, admin_notes } = req.body;
      if (!title?.trim()) return res.status(400).json({ success: false, error: 'El título es obligatorio' });

      const result = await query(
        `UPDATE activity_templates SET
           title = $1, description = $2,
           participant_types = $3, tags = $4, admin_notes = $5
         WHERE id = $6 RETURNING *`,
        [
          title.trim(),
          description?.trim() || null,
          participant_types || [],
          tags || [],
          admin_notes?.trim() || null,
          id,
        ]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Actividad no encontrada' });

      const eventTypeIds: number[] = Array.isArray(event_type_ids) ? event_type_ids : [];
      await query(`DELETE FROM activity_template_event_types WHERE activity_template_id = $1`, [id]);
      if (eventTypeIds.length > 0) {
        await query(
          `INSERT INTO activity_template_event_types (activity_template_id, event_type_id)
           SELECT $1, unnest($2::int[])`,
          [id, eventTypeIds]
        );
      }

      return res.status(200).json({ success: true, template: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      const deleteResult = await query(`DELETE FROM activity_templates WHERE id = $1`, [id]);
      if (deleteResult.rowCount === 0) return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in actividades-catalogo/[id] API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
