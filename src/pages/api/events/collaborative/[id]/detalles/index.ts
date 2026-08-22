// src/pages/api/events/collaborative/[id]/detalles/index.ts
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  const { eventId } = ctx;

  if (req.method === 'GET') {
    const result = await query(
      `SELECT * FROM event_custom_details WHERE event_id = $1`,
      [eventId],
    );
    return res.status(200).json({ details: result.rows[0] || null });
  }

  if (req.method === 'PUT') {
    if (!ctx.isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede editar esta sección' });

    const {
      reminder_text_short = null,
      reminder_text_medium = null,
      internal_notes = null,
      image_url_1 = null,
      image_url_2 = null,
    } = req.body as {
      reminder_text_short?: string | null;
      reminder_text_medium?: string | null;
      internal_notes?: string | null;
      image_url_1?: string | null;
      image_url_2?: string | null;
    };

    if (typeof reminder_text_short === 'string' && reminder_text_short.length > 25) {
      return res.status(400).json({ error: 'El primer texto no puede superar los 25 caracteres' });
    }
    if (typeof reminder_text_medium === 'string' && reminder_text_medium.length > 40) {
      return res.status(400).json({ error: 'El segundo texto no puede superar los 40 caracteres' });
    }

    const result = await query(
      `INSERT INTO event_custom_details (event_id, reminder_text_short, reminder_text_medium, internal_notes, image_url_1, image_url_2)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (event_id) DO UPDATE SET
         reminder_text_short = $2,
         reminder_text_medium = $3,
         internal_notes = $4,
         image_url_1 = $5,
         image_url_2 = $6,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [eventId, reminder_text_short, reminder_text_medium, internal_notes, image_url_1, image_url_2],
    );

    return res.status(200).json({ details: result.rows[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
