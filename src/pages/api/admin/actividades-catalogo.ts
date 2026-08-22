import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    if (req.method === 'GET') {
      const result = await query(
        `SELECT t.*,
                COALESCE(
                  json_agg(json_build_object('id', et.id, 'name', et.name)) FILTER (WHERE et.id IS NOT NULL),
                  '[]'
                ) AS event_type_details
         FROM activity_templates t
         LEFT JOIN activity_template_event_types atet ON atet.activity_template_id = t.id
         LEFT JOIN event_types et ON et.id = atet.event_type_id
         GROUP BY t.id
         ORDER BY t.usage_count DESC, t.created_at DESC`
      );
      return res.status(200).json({ success: true, templates: result.rows });
    }

    if (req.method === 'POST') {
      const { title, description, event_type_ids, participant_types, tags, admin_notes } = req.body;
      if (!title?.trim()) return res.status(400).json({ success: false, error: 'El título es obligatorio' });

      const result = await query(
        `INSERT INTO activity_templates (title, description, participant_types, tags, admin_notes)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          title.trim(),
          description?.trim() || null,
          participant_types || [],
          tags || [],
          admin_notes?.trim() || null,
        ]
      );
      const template = result.rows[0];

      const eventTypeIds: number[] = Array.isArray(event_type_ids) ? event_type_ids : [];
      if (eventTypeIds.length > 0) {
        await query(
          `INSERT INTO activity_template_event_types (activity_template_id, event_type_id)
           SELECT $1, unnest($2::int[])`,
          [template.id, eventTypeIds]
        );
      }

      return res.status(201).json({ success: true, template });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in actividades-catalogo API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
