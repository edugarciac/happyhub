import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { requireAdminSession } from '../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const [usersResult, reservationsResult, pendingResult, reviewsResult] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'client'`, []),
      query(`SELECT COUNT(*) as count FROM reservations`, []),
      query(`SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'`, []),
      query(`SELECT COUNT(*) as count FROM reviews`, []),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: parseInt(usersResult.rows[0].count),
        totalReservations: parseInt(reservationsResult.rows[0].count),
        pendingReservations: parseInt(pendingResult.rows[0].count),
        totalReviews: parseInt(reviewsResult.rows[0].count),
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    console.error('Error in dashboard-stats API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
