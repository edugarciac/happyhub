import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { queryOne } from '../../../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface ReservationResponse {
  success: boolean;
  reservation?: any;
  user?: any;
  error?: string;
}

interface DecodedToken {
  userId: number;
  email: string;
  role: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReservationResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check JWT authentication and verify role='admin'
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

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden ver esta información',
      });
    }

    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de reserva inválido',
      });
    }

    // Fetch reservation with user details
    const reservation = await queryOne(
      `SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [parseInt(id)]
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada',
      });
    }

    return res.status(200).json({
      success: true,
      reservation,
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la reserva',
    });
  }
}
