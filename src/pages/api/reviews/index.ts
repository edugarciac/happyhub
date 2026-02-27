import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../../../lib/db';
import { reviewSchema, isReservationEligibleForReview } from '../../../utils/validators';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface ReviewResponse {
  success: boolean;
  review?: any;
  reviews?: any[];
  error?: string;
}

interface DecodedToken {
  userId: number;
  email: string;
  role: string;
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
    // 3.1: Check JWT authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado. Inicia sesión para enviar una reseña',
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

    // Validate request body with Zod
    const validation = reviewSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Datos de reseña inválidos',
      });
    }

    const { reservation_id, rating, review_text } = validation.data;

    // 3.2: Validate reservation exists and belongs to authenticated user
    const reservation = await queryOne<{
      id: number;
      email: string;
      name: string;
      status: string;
      event_date: string;
    }>(
      'SELECT id, email, name, status, event_date FROM reservations WHERE id = $1',
      [reservation_id]
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada',
      });
    }

    if (reservation.email !== decoded.email) {
      return res.status(403).json({
        success: false,
        error: 'Solo puedes valorar tus propias reservas',
      });
    }

    // 3.3: Check reservation status and event_date
    if (!isReservationEligibleForReview({
      status: reservation.status,
      event_date: reservation.event_date,
    })) {
      if (reservation.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden valorar eventos confirmados',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'El evento debe haber finalizado para poder valorarlo',
      });
    }

    // 3.4: Check if review already exists
    const existingReview = await queryOne(
      'SELECT id FROM reviews WHERE reservation_id = $1',
      [reservation_id]
    );

    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: 'Ya has valorado este evento',
      });
    }

    // 3.5: Insert review with is_published=false
    const result = await queryOne<{
      id: number;
      reservation_id: number;
      rating: number;
      review_text: string | null;
      customer_name: string;
      is_published: boolean;
      created_at: Date;
    }>(
      `INSERT INTO reviews (reservation_id, rating, review_text, customer_name, is_published)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, reservation_id, rating, review_text, customer_name, is_published, created_at`,
      [reservation_id, rating, review_text || null, reservation.name]
    );

    // 3.6: Return 201 Created with review data
    return res.status(201).json({
      success: true,
      review: result,
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);

    // Handle database unique constraint error
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Ya has valorado este evento',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error al enviar la reseña',
    });
  }
}

async function handleGetReviews(
  req: NextApiRequest,
  res: NextApiResponse<ReviewResponse>
) {
  try {
    // 4.1: Public endpoint (no auth required)
    // 4.2: Query published reviews only
    // 4.3: Pagination support
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query<{
      id: number;
      rating: number;
      review_text: string | null;
      customer_name: string;
      created_at: Date;
    }>(
      `SELECT id, rating, review_text, customer_name, created_at
       FROM reviews
       WHERE is_published = true
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // 4.4: Return array of reviews
    return res.status(200).json({
      success: true,
      reviews: result.rows,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener reseñas',
    });
  }
}
