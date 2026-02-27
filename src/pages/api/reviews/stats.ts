import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '../../../lib/db';

interface StatsResponse {
  success: boolean;
  stats?: {
    average: number | null;
    count: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 5.1-5.2: Calculate aggregate statistics from published reviews only
    const result = await queryOne<{
      average: string | null;
      count: string;
    }>(
      `SELECT
         ROUND(AVG(rating), 1) as average,
         COUNT(*) as count
       FROM reviews
       WHERE is_published = true`
    );

    // 5.3: Return stats (average as number or null, count as number)
    const stats = {
      average: result?.average ? parseFloat(result.average) : null,
      count: result?.count ? parseInt(result.count) : 0,
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de reseñas',
    });
  }
}
