import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { event } = ctx;

  let filtered = false;
  let rows;

  if (event.category) {
    const filteredResult = await query(
      `SELECT DISTINCT t.id, t.title, t.description, t.tags
       FROM activity_templates t
       JOIN activity_template_event_types atet ON atet.activity_template_id = t.id
       JOIN event_types et ON et.id = atet.event_type_id
       WHERE et.name ILIKE $1
       ORDER BY t.title ASC`,
      [event.category]
    );
    if (filteredResult.rows.length > 0) {
      filtered = true;
      rows = filteredResult.rows;
    }
  }

  if (!rows) {
    const allResult = await query(
      `SELECT id, title, description, tags FROM activity_templates ORDER BY title ASC`
    );
    rows = allResult.rows;
  }

  return res.status(200).json({ filtered, activities: rows });
});
