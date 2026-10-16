import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

// Migración 029 (una sola vez): Baby Shower sustituye a Boda y Comunión. Solo actúa si no existe "Baby Shower",
// así que después manda lo que se configure en el panel de administración.
let babyShowerApplied: Promise<void> | null = null;
function ensureBabyShowerEventType(): Promise<void> {
  if (!babyShowerApplied) {
    babyShowerApplied = query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM event_types WHERE name = 'Baby Shower') THEN
          INSERT INTO event_types (name, description, icon, active, sort_order)
          VALUES ('Baby Shower', 'Celebra la llegada del bebé', '🍼', true,
                  COALESCE((SELECT sort_order FROM event_types WHERE name = 'Comunión' LIMIT 1), 0));
          UPDATE event_types SET active = false WHERE name IN ('Boda', 'Comunión');
        END IF;
      END
      $$`).then(
      () => undefined,
      (err) => {
        babyShowerApplied = null;
        console.error('Error aplicando la migración 029 (Baby Shower):', err);
      }
    );
  }
  return babyShowerApplied;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureBabyShowerEventType();
    const result = await query(
      'SELECT id, name, description, icon, image_url, features FROM event_types WHERE active = true ORDER BY sort_order ASC, name ASC'
    );
    return res.status(200).json({ success: true, eventTypes: result.rows });
  } catch (error) {
    console.error('Error fetching event types:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
