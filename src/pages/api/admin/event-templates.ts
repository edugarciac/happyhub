import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminSession } from '@/utils/adminAuth';
import { z } from 'zod';
import {
  getAllTemplatesWithMilestones,
  createTemplate,
  addMilestoneToTemplate,
  deleteTemplate,
  deleteMilestone,
} from '@/utils/db/event-templates';

const createTemplateSchema = z.object({
  event_type: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
});

const addMilestoneSchema = z.object({
  template_id: z.number().int(),
  emoji: z.string().max(10).optional().nullable(),
  title: z.string().min(1).max(255),
  hito_type: z.string().min(1).max(50),
  phase: z.enum(['before', 'during', 'after']),
  sort_order: z.number().int().optional().default(0),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdminSession(req, res);
  if (!admin) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    const data = await getAllTemplatesWithMilestones();
    return res.status(200).json({ templates: data });
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'create_template') {
      const parsed = createTemplateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const template = await createTemplate(parsed.data.event_type, parsed.data.name);
      return res.status(201).json({ template });
    }

    if (action === 'add_milestone') {
      const parsed = addMilestoneSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { template_id, ...rest } = parsed.data;
      const milestone = await addMilestoneToTemplate(template_id, { ...rest, emoji: rest.emoji ?? null });
      return res.status(201).json({ milestone });
    }

    return res.status(400).json({ error: 'Acción desconocida' });
  }

  if (req.method === 'DELETE') {
    const { type, id } = req.body;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'ID requerido' });

    if (type === 'template') {
      await deleteTemplate(parseInt(id));
      return res.status(200).json({ deleted: true });
    }
    if (type === 'milestone') {
      await deleteMilestone(parseInt(id));
      return res.status(200).json({ deleted: true });
    }
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
