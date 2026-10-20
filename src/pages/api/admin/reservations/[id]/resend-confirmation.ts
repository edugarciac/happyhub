import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { isEmailConfigured } from '@/lib/mailer';
import { sendReservationRequestNotifications } from '@/lib/reservationNotifications';

/** Reenvía al cliente el correo de "Solicitud de reserva" de una reserva pendiente (p. ej. reservas manuales). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const reservationId = parseInt(String(req.query.id));
  if (isNaN(reservationId)) {
    return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({ success: false, error: 'El envío de correos no está configurado (RESEND_API_KEY)' });
  }

  try {
    const reservation = await queryOne<{ status: string; email: string | null }>(
      'SELECT r.status, u.email FROM reservations r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1',
      [reservationId]
    );
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }
    if (reservation.status !== 'pending') {
      return res.status(409).json({ success: false, error: 'Solo se puede reenviar el correo de solicitud de reservas pendientes' });
    }
    if (!reservation.email) {
      return res.status(400).json({ success: false, error: 'La reserva no tiene email de cliente' });
    }

    const result = await sendReservationRequestNotifications(reservationId);
    if (!result.emailSent) {
      return res.status(502).json({ success: false, error: 'No se pudo enviar el correo. Inténtalo de nuevo.' });
    }
    console.log(`[resend-confirmation] Reservation ${reservationId} email resent by ${admin.email}`);
    return res.status(200).json({ success: true, email: reservation.email });
  } catch (error: any) {
    console.error('Error resending reservation email:', error);
    return res.status(500).json({ success: false, error: `Error al reenviar el correo: ${error?.message || error}` });
  }
}
