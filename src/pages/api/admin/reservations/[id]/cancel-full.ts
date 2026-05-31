import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, query } from '@/lib/db';
import { google } from 'googleapis';
import axios from 'axios';
import { verifyAdminSession } from '../../../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;
  const reservationId = parseInt(id as string);

  if (!reservationId || isNaN(reservationId)) {
    return res.status(400).json({ error: 'ID de reserva inválido' });
  }

  try {
    const reservation = await queryOne(
      `SELECT r.id, r.status, r.google_calendar_event_id,
              u.name, u.email, u.phone, r.event_date, r.time_slot
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [reservationId]
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'La reserva ya está cancelada' });
    }

    // 1. Delete Google Calendar event
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

    // 2. Cancel in DB
    await query(
      `UPDATE reservations SET status = 'cancelled', google_calendar_event_id = NULL, updated_at = NOW() WHERE id = $1`,
      [reservationId]
    );

    // 3. Notify n8n (non-blocking)
    if (process.env.N8N_WEBHOOK_URL) {
      axios.post(process.env.N8N_WEBHOOK_URL, {
        event: 'reservation_cancelled_by_admin',
        reservationId,
        customerName: reservation.name,
        customerEmail: reservation.email,
        customerPhone: reservation.phone,
        eventDate: reservation.event_date,
        timeSlot: reservation.time_slot,
        timestamp: new Date().toISOString(),
      }, { timeout: 5000 }).catch((e: any) => console.error('n8n notify failed:', e?.message));
    }

    return res.status(200).json({ success: true, message: 'Reserva cancelada y eliminada del calendario' });
  } catch (error: unknown) {
    console.error('cancel-full error:', error);
    const message = error instanceof Error ? error.message : 'Error al cancelar la reserva';
    return res.status(500).json({ error: message });
  }
}
