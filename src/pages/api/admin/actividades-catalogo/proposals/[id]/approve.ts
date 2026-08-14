import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

const bodySchema = z.object({
  eventTypeIds: z.array(z.number().int()).optional().default([]),
  participantTypes: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const admin = await requireAdminSession(req, res);
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const id = parseInt(req.query.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });

    const proposal = await queryOne<{ id: number; title: string; description: string | null; status: string }>(
      `SELECT id, title, description, status FROM activity_catalog_proposals WHERE id = $1`,
      [id]
    );
    if (!proposal) return res.status(404).json({ success: false, error: 'Propuesta no encontrada' });
    if (proposal.status !== 'pending') {
      return res.status(409).json({ success: false, error: 'Esta propuesta ya ha sido revisada' });
    }

    const templateResult = await query(
      `INSERT INTO activity_templates (title, description, participant_types, tags)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [proposal.title, proposal.description, parsed.data.participantTypes, parsed.data.tags]
    );
    const templateId = templateResult.rows[0].id;

    if (parsed.data.eventTypeIds.length > 0) {
      await query(
        `INSERT INTO activity_template_event_types (activity_template_id, event_type_id)
         SELECT $1, unnest($2::int[])`,
        [templateId, parsed.data.eventTypeIds]
      );
    }

    await query(
      `UPDATE activity_catalog_proposals
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [admin.email || 'admin', id]
    );

    return res.status(200).json({ success: true, templateId });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error approving proposal:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
