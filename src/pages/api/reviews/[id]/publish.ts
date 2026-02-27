import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface PublishResponse {
  success: boolean;
  review?: any;
  error?: string;
}

interface DecodedToken {
  userId: number;
  email: string;
  role: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishResponse>
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 5.4: Check JWT authentication and admin role
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
    }

    const token = authHeader.substring(7);
    let decoded: DecodedToken;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
      });
    }

    // 5.5: Only allow if role is 'admin'
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden moderar reseñas',
      });
    }

    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de reseña inválido',
      });
    }

    // Update is_published to true
    const result = await queryOne<{
      id: number;
      reservation_id: number;
      rating: number;
      review_text: string | null;
      customer_name: string;
      is_published: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE reviews
       SET is_published = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, reservation_id, rating, review_text, customer_name, is_published, created_at, updated_at`,
      [parseInt(id)]
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Reseña no encontrada',
      });
    }

    return res.status(200).json({
      success: true,
      review: result,
    });
  } catch (error) {
    console.error('Error publishing review:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al publicar la reseña',
    });
  }
}
