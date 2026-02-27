import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { requireAdmin } from '../../../utils/adminAuth';

interface ReviewsResponse {
  success: boolean;
  reviews?: any[];
  total?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReviewsResponse>
) {
  try {
    // Require admin auth
    requireAdmin(req);

    if (req.method === 'GET') {
      return handleGetReviews(req, res);
    }

    if (req.method === 'DELETE') {
      return handleDeleteReview(req, res);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleGetReviews(
  req: NextApiRequest,
  res: NextApiResponse<ReviewsResponse>
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const filterPublished = req.query.published as string;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (customer_name ILIKE $${paramCount} OR review_text ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Published filter
    if (filterPublished === 'true' || filterPublished === 'false') {
      paramCount++;
      whereClause += ` AND is_published = $${paramCount}`;
      params.push(filterPublished === 'true');
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM reviews ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get reviews with pagination
    params.push(limit, offset);
    const result = await query(
      `SELECT r.*, res.event_date, res.event_type
       FROM reviews r
       LEFT JOIN reservations res ON r.reservation_id = res.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    return res.status(200).json({
      success: true,
      reviews: result.rows,
      total,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener reseñas',
    });
  }
}

async function handleDeleteReview(
  req: NextApiRequest,
  res: NextApiResponse<ReviewsResponse>
) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de reseña requerido',
      });
    }

    await query('DELETE FROM reviews WHERE id = $1', [parseInt(id as string)]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar reseña',
    });
  }
}
