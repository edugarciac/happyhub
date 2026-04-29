import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, query } from '@/lib/db';
import { google } from 'googleapis';

// Called when a user cancels Stripe checkout for a pending_deposit reservation.
// No auth required — reservation must be in pending_deposit status (not yet confirmed).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reservationId } = req.body as { reservationId: string };

  if (!reservationId) {
    return res.status(400).json({ error: 'reservationId requerido' });
  }

  try {
    const reservation = await queryOne(
      `SELECT id, status, payment_status, google_calendar_event_id
       FROM reservations
       WHERE id = $1 OR reservation_id = $1`,
      [reservationId]
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Only cancel if still pending payment — prevent accidental cancellation of paid reservations
    if (reservation.payment_status !== 'pending_deposit' && reservation.payment_status !== 'pending') {
      return res.status(400).json({ error: 'La reserva no está en estado pendiente de pago' });
    }

    // Delete Google Calendar event
    if (reservation.google_calendar_event_id) {
      try {
        const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID } = process.env;
        if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_CALENDAR_ID) {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: GOOGLE_CLIENT_EMAIL,
              private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
          });
          const calendar = google.calendar({ version: 'v3', auth });
          await calendar.events.delete({
            calendarId: GOOGLE_CALENDAR_ID,
            eventId: reservation.google_calendar_event_id,
          });
        }
      } catch (calErr: any) {
        if (calErr?.code !== 404 && calErr?.status !== 404) {
          console.error('Calendar delete error (non-fatal):', calErr?.message);
        }
      }
    }

    await query(
      `UPDATE reservations
       SET status = 'cancelled', google_calendar_event_id = NULL, updated_at = NOW()
       WHERE id = $1`,
      [reservation.id]
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('cancel-pending error:', error);
    return res.status(500).json({ error: error.message || 'Error al cancelar' });
  }
}
