import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await query(
      'SELECT id, name, description, icon, image_url, features FROM event_types WHERE active = true ORDER BY sort_order ASC, name ASC'
    );
    return res.status(200).json({ success: true, eventTypes: result.rows });
  } catch (error) {
    console.error('Error fetching event types:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
