import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { query, queryOne } from '../../../lib/db';

interface ReviewResponse {
  success: boolean;
  review?: any;
  reviews?: any[];
  total?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReviewResponse>
) {
  if (req.method === 'POST') {
    return handleSubmitReview(req, res);
  }

  if (req.method === 'GET') {
    return handleGetReviews(req, res);
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleSubmitReview(
  req: NextApiRequest,
  res: NextApiResponse<ReviewResponse>
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado. Inicia sesión para enviar una reseña',
      });
    }

    // Check user has at least one completed reservation
    const completedRes = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE u.email = $1 AND r.status = 'completed'`,
      [session.user.email]
    );
    if (!completedRes || parseInt(completedRes.count) === 0) {
      return res.status(403).json({
        success: false,
        error: 'Solo puedes enviar una resena si tienes al menos una reserva realizada',
      });
    }

    const { title, rating, review_text, photo_urls } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'El título es obligatorio (mínimo 3 caracteres)' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'La valoración debe ser entre 1 y 5' });
    }

    const userName = session.user.name || session.user.email || 'Anónimo';

    const result = await queryOne(
      `INSERT INTO reviews (reservation_id, rating, review_text, customer_name, title, photo_urls, status)
       VALUES (NULL, $1, $2, $3, $4, $5, 'pending_review')
       RETURNING id, rating, review_text, customer_name, title, photo_urls, status, created_at`,
      [rating, review_text || null, userName, title.trim(), JSON.stringify(photo_urls || [])]
    );

    return res.status(201).json({ success: true, review: result });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return res.status(500).json({ success: false, error: 'Error al enviar la reseña' });
  }
}

async function handleGetReviews(
  req: NextApiRequest,
  res: NextApiResponse<ReviewResponse>
) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM reviews WHERE status = 'published'`
    );
    const total = parseInt(countResult?.count || '0');

    const result = await query(
      `SELECT id, rating, review_text, customer_name, title, photo_urls, created_at
       FROM reviews
       WHERE status = 'published'
       ORDER BY rating DESC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.status(200).json({
      success: true,
      reviews: result.rows,
      total,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener reseñas' });
  }
}
