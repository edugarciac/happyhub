import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { query, queryOne } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, participant } = ctx;
  const templateId = parseInt(req.query.templateId as string, 10);
  if (isNaN(templateId)) return res.status(400).json({ error: 'ID inválido' });

  const template = await queryOne<{ id: number; title: string; description: string | null }>(
    `SELECT id, title, description FROM activity_templates WHERE id = $1`,
    [templateId]
  );
  if (!template) return res.status(404).json({ error: 'Actividad de catálogo no encontrada' });

  const result = await query(
    `INSERT INTO event_activities (event_id, title, description, proposed_by_participant_id, source_template_id, status)
     VALUES ($1, $2, $3, $4, $5, 'approved') RETURNING *`,
    [eventId, template.title, template.description, participant?.id ?? null, template.id]
  );

  await query(`UPDATE activity_templates SET usage_count = usage_count + 1 WHERE id = $1`, [template.id]);

  return res.status(201).json({ activity: result.rows[0] });
});
