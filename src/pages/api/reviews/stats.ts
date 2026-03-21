import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const result = await queryOne<{ average: string | null; count: string }>(
      `SELECT ROUND(AVG(rating), 1) as average, COUNT(*) as count
       FROM reviews WHERE status = 'published'`
    );

    return res.status(200).json({
      success: true,
      stats: {
        average: result?.average ? parseFloat(result.average) : null,
        count: result?.count ? parseInt(result.count) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
}
