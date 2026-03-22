import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await query(
      'SELECT id, title, price, description, features, image_url FROM service_catalog WHERE active = true ORDER BY sort_order ASC, title ASC'
    );
    return res.status(200).json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
