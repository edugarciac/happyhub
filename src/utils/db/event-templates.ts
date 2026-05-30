import { query } from '@/lib/db';

export interface EventTemplate {
  id: number;
  event_type: string;
  name: string;
  created_at: string;
}

export interface EventTemplateMilestone {
  id: number;
  template_id: number;
  emoji: string | null;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
  sort_order: number;
}

export async function getTemplatesByEventType(eventType: string): Promise<EventTemplateMilestone[]> {
  const tmpl = await query<EventTemplate>(
    `SELECT * FROM event_templates WHERE event_type = $1 LIMIT 1`,
    [eventType]
  );
  if (!tmpl.rows.length) return [];
  const result = await query<EventTemplateMilestone>(
    `SELECT * FROM event_template_milestones WHERE template_id = $1 ORDER BY phase, sort_order`,
    [tmpl.rows[0].id]
  );
  return result.rows;
}

export async function getAllTemplatesWithMilestones(): Promise<{ template: EventTemplate; milestones: EventTemplateMilestone[] }[]> {
  const templates = await query<EventTemplate>(`SELECT * FROM event_templates ORDER BY event_type`);
  const result = await Promise.all(
    templates.rows.map(async (t) => {
      const ms = await query<EventTemplateMilestone>(
        `SELECT * FROM event_template_milestones WHERE template_id = $1 ORDER BY phase, sort_order`,
        [t.id]
      );
      return { template: t, milestones: ms.rows };
    })
  );
  return result;
}

export async function createTemplate(eventType: string, name: string): Promise<EventTemplate> {
  const result = await query<EventTemplate>(
    `INSERT INTO event_templates (event_type, name) VALUES ($1, $2) RETURNING *`,
    [eventType, name]
  );
  return result.rows[0];
}

export async function addMilestoneToTemplate(
  templateId: number,
  milestone: Omit<EventTemplateMilestone, 'id' | 'template_id'>
): Promise<EventTemplateMilestone> {
  const result = await query<EventTemplateMilestone>(
    `INSERT INTO event_template_milestones (template_id, emoji, title, hito_type, phase, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [templateId, milestone.emoji, milestone.title, milestone.hito_type, milestone.phase, milestone.sort_order]
  );
  return result.rows[0];
}

export async function deleteTemplate(id: number): Promise<void> {
  await query(`DELETE FROM event_templates WHERE id = $1`, [id]);
}

export async function deleteMilestone(id: number): Promise<void> {
  await query(`DELETE FROM event_template_milestones WHERE id = $1`, [id]);
}
