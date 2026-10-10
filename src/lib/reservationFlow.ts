import crypto from 'crypto';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { reservationCancelledEmail } from '@/lib/emailTemplates';
import { deleteCalendarEvent } from '@/lib/googleCalendar';

// Aplica la migración 023 de forma idempotente, una vez por instancia (igual que otras migraciones de lib/db.ts).
let columnsReady: Promise<void> | null = null;
export function ensureReservationFlowColumns(): Promise<void> {
  if (!columnsReady) {
    columnsReady = (async () => {
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20)');
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_due_at TIMESTAMPTZ');
      await query(
        `UPDATE reservations SET status = 'confirmed', updated_at = NOW()
         WHERE status = 'approved' AND payment_status IN ('deposit_paid', 'fully_paid')`
      );
      await query(`CREATE TABLE IF NOT EXISTS payment_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(64) UNIQUE NOT NULL,
        reservation_id INTEGER NOT NULL,
        token_type VARCHAR(30) NOT NULL DEFAULT 'remaining_payment',
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    })().catch((err) => {
      columnsReady = null; // reintentar en la siguiente petición
      throw err;
    });
  }
  return columnsReady;
}

/** Crea un enlace de pago de la señal que caduca en dueAt. Devuelve la URL pública. */
export async function createDepositPaymentLink(reservationId: number, dueAt: Date): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await query(
    "INSERT INTO payment_tokens (token, reservation_id, token_type, expires_at) VALUES ($1, $2, 'deposit', $3)",
    [token, reservationId, dueAt]
  );
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.happyhub.es';
  return `${baseUrl}/pagar/${token}`;
}

/**
 * Cancela las reservas aprobadas cuya señal no se ha pagado dentro del plazo, libera la franja,
 * borra el evento de Calendar y avisa al cliente. Nunca lanza: devuelve cuántas ha cancelado.
 * El UPDATE ... RETURNING es atómico, así que cada reserva se notifica una sola vez aunque se ejecute en paralelo.
 */
export async function expireUnpaidReservations(): Promise<number> {
  try {
    await ensureReservationFlowColumns();
    const expired = await query<{
      id: number;
      event_date: string;
      time_slot: string;
      google_calendar_event_id: string | null;
      name: string | null;
      email: string | null;
    }>(
      `WITH expired AS (
         UPDATE reservations
         SET status = 'cancelled', cancellation_reason = 'Plazo de pago vencido', updated_at = NOW()
         WHERE status = 'approved'
           AND payment_due_at IS NOT NULL
           AND payment_due_at < NOW()
           AND COALESCE(payment_status, 'pending') NOT IN ('deposit_paid', 'fully_paid')
         RETURNING id, event_date, time_slot, google_calendar_event_id, user_id
       )
       SELECT e.id, TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date, e.time_slot, e.google_calendar_event_id, u.name, u.email
       FROM expired e LEFT JOIN users u ON u.id = e.user_id`
    );

    for (const r of expired.rows) {
      console.log(`[reservationFlow] Reservation ${r.id} cancelled: payment deadline passed`);
      if (r.google_calendar_event_id) await deleteCalendarEvent(r.google_calendar_event_id);
      if (r.email) {
        await sendEmail({
          to: r.email,
          ...reservationCancelledEmail({
            name: r.name || '',
            status: 'cancelled',
            date: r.event_date,
            timeSlot: r.time_slot,
            reason: 'No hemos recibido el pago de la señal dentro del plazo de 24 horas.',
          }),
        });
      }
    }
    return expired.rows.length;
  } catch (err) {
    console.error('[reservationFlow] Error expiring unpaid reservations:', err);
    return 0;
  }
}
