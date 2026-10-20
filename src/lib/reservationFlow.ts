import crypto from 'crypto';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { buildReservationCode, depositReminderEmail, remainingPaymentReminderEmail, reservationCancelledEmail } from '@/lib/emailTemplates';
import { PAYMENT_GRACE_HOURS, PAYMENT_WINDOW_HOURS, REMAINING_REMINDER_DAYS_BEFORE } from '@/config/payments';

// Aplica la migración 023 de forma idempotente, una vez por instancia (igual que otras migraciones de lib/db.ts).
let columnsReady: Promise<void> | null = null;
export function ensureReservationFlowColumns(): Promise<void> {
  if (!columnsReady) {
    columnsReady = (async () => {
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20)');
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_due_at TIMESTAMPTZ');
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS last_payment_error TEXT');
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS last_payment_error_at TIMESTAMPTZ');
      // Horas adicionales de la tarde (20:00 → 23:00)
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS extra_hours INTEGER NOT NULL DEFAULT 0');
      // Devoluciones al cancelar (política de 15 días)
      await query(`ALTER TABLE reservations
        ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ`);
      // Migración 034: recordatorio del pago del resto 3 días antes del evento
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS remaining_reminder_sent_at TIMESTAMPTZ');
      // Migración 032: recordatorio de la señal antes de cancelar
      await query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMPTZ');
      // Migración 031: servicios adicionales contratados [{id, title, price}]
      await query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS extras JSONB NOT NULL DEFAULT '[]'::jsonb");
      // Migración 028: cobro del día y fianza por preautorización
      await query(`ALTER TABLE reservations
        ADD COLUMN IF NOT EXISTS remaining_payment_method VARCHAR(20),
        ADD COLUMN IF NOT EXISTS security_deposit_status VARCHAR(20) DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS security_deposit_method VARCHAR(20),
        ADD COLUMN IF NOT EXISTS security_deposit_payment_intent VARCHAR(255),
        ADD COLUMN IF NOT EXISTS security_deposit_amount_held DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS security_deposit_held_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS security_deposit_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS security_deposit_captured DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS security_deposit_resolved_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS security_deposit_note TEXT`);
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
 * Cancela las reservas aprobadas cuya señal no se ha pagado dentro del plazo (alargado al enviar el
 * recordatorio) y que ya recibieron el recordatorio: nunca se cancela sin aviso previo. Libera la franja
 * y avisa al cliente. Nunca lanza: devuelve cuántas ha cancelado.
 * El UPDATE ... RETURNING es atómico, así que cada reserva se notifica una sola vez aunque se ejecute en paralelo.
 */
export async function expireUnpaidReservations(): Promise<number> {
  try {
    await ensureReservationFlowColumns();
    const expired = await query<{
      id: number;
      event_date: string;
      time_slot: string;
      name: string | null;
      email: string | null;
    }>(
      `WITH expired AS (
         UPDATE reservations
         SET status = 'cancelled', cancellation_reason = 'Plazo de pago vencido', updated_at = NOW()
         WHERE status = 'approved'
           AND payment_due_at IS NOT NULL
           AND payment_due_at < NOW()
           AND payment_reminder_sent_at IS NOT NULL
           AND COALESCE(payment_status, 'pending') NOT IN ('deposit_paid', 'fully_paid')
         RETURNING id, event_date, time_slot, user_id
       )
       SELECT e.id, TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date, e.time_slot, u.name, u.email
       FROM expired e LEFT JOIN users u ON u.id = e.user_id`
    );

    for (const r of expired.rows) {
      console.log(`[reservationFlow] Reservation ${r.id} cancelled: payment deadline passed`);
      if (r.email) {
        await sendEmail({
          to: r.email,
          ...reservationCancelledEmail({
            name: r.name || '',
            status: 'cancelled',
            date: r.event_date,
            timeSlot: r.time_slot,
            reason: `No hemos recibido el pago de la señal en las ${PAYMENT_WINDOW_HOURS + PAYMENT_GRACE_HOURS} horas siguientes a la aprobación, pese al recordatorio que te enviamos.`,
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

/**
 * Recordatorio a las reservas aprobadas que han pasado el plazo de pago sin pagar la señal: alarga el
 * plazo PAYMENT_GRACE_HOURS desde ahora (también la caducidad de los enlaces de pago) y envía un correo
 * con un enlace nuevo. El UPDATE ... RETURNING es atómico: cada reserva se avisa una sola vez.
 * Nunca lanza: devuelve cuántos recordatorios ha procesado.
 */
export async function sendDepositReminders(): Promise<number> {
  try {
    await ensureReservationFlowColumns();
    const due = await query<{
      id: number;
      event_date: string;
      time_slot: string;
      deposit_amount: string | null;
      total_price: string | null;
      payment_method: string | null;
      payment_due_at: Date;
      name: string | null;
      email: string | null;
    }>(
      `WITH reminded AS (
         UPDATE reservations
         SET payment_reminder_sent_at = NOW(),
             -- En punto: el cron diario de las 07:00 que avisa cancela al día siguiente aunque corra unos segundos antes
             payment_due_at = date_trunc('hour', GREATEST(payment_due_at, NOW())) + make_interval(hours => $1::int),
             updated_at = NOW()
         WHERE status = 'approved'
           AND payment_due_at IS NOT NULL
           AND payment_due_at < NOW()
           AND payment_reminder_sent_at IS NULL
           AND COALESCE(payment_status, 'pending') NOT IN ('deposit_paid', 'fully_paid')
         RETURNING id, event_date, time_slot, deposit_amount, total_price, payment_method, payment_due_at, user_id
       )
       SELECT m.id, TO_CHAR(m.event_date, 'YYYY-MM-DD') AS event_date, m.time_slot, m.deposit_amount, m.total_price,
              m.payment_method, m.payment_due_at, u.name, u.email
       FROM reminded m LEFT JOIN users u ON u.id = m.user_id`,
      [PAYMENT_GRACE_HOURS]
    );

    for (const r of due.rows) {
      const dueAt = new Date(r.payment_due_at);
      console.log(`[reservationFlow] Reservation ${r.id}: deposit reminder, new deadline ${dueAt.toISOString()}`);
      try {
        // Los enlaces que ya tiene el cliente siguen valiendo hasta el nuevo plazo
        await query(
          "UPDATE payment_tokens SET expires_at = $1 WHERE reservation_id = $2 AND token_type = 'deposit' AND used = false",
          [dueAt, r.id]
        );
        if (!r.email) continue;
        const payUrl = await createDepositPaymentLink(r.id, dueAt);
        await sendEmail({
          to: r.email,
          ...depositReminderEmail({
            name: r.name || '',
            code: buildReservationCode(r.event_date, r.id),
            date: r.event_date,
            timeSlot: r.time_slot,
            depositAmount: Number(r.deposit_amount) || 0,
            totalPrice: Number(r.total_price) || 0,
            paymentMethod: r.payment_method || 'card',
            payUrl,
            dueAt,
          }),
        });
      } catch (err) {
        console.error('[reservationFlow] Error sending deposit reminder', r.id, err);
      }
    }
    return due.rows.length;
  } catch (err) {
    console.error('[reservationFlow] Error sending deposit reminders:', err);
    return 0;
  }
}

/**
 * Recordatorio a las reservas confirmadas con resto pendiente cuyo evento es en los próximos
 * REMAINING_REMINDER_DAYS_BEFORE días: correo con un enlace que cobra solo el resto
 * (la fianza se bloquea el día del evento). Atómico: cada reserva se avisa una sola vez.
 * Nunca lanza: devuelve cuántas reservas ha procesado.
 */
export async function sendRemainingPaymentReminders(): Promise<number> {
  try {
    await ensureReservationFlowColumns();
    const due = await query<{
      id: number;
      event_date: string;
      time_slot: string;
      total_price: string | null;
      deposit_paid: string | null;
      name: string | null;
      email: string | null;
    }>(
      `WITH reminded AS (
         UPDATE reservations
         SET remaining_reminder_sent_at = NOW(), updated_at = NOW()
         WHERE status = 'confirmed'
           AND remaining_reminder_sent_at IS NULL
           AND COALESCE(payment_status, 'pending') <> 'fully_paid'
           AND COALESCE(total_price, 0) > COALESCE(deposit_paid, 0)
           AND event_date >= (NOW() AT TIME ZONE 'Europe/Madrid')::date
           AND event_date <= (NOW() AT TIME ZONE 'Europe/Madrid')::date + $1::int
         RETURNING id, event_date, time_slot, total_price, deposit_paid, user_id
       )
       SELECT m.id, TO_CHAR(m.event_date, 'YYYY-MM-DD') AS event_date, m.time_slot, m.total_price, m.deposit_paid,
              COALESCE(u.name, ca.customer_name) AS name, COALESCE(u.email, ca.customer_email) AS email
       FROM reminded m
       LEFT JOIN users u ON u.id = m.user_id
       LEFT JOIN LATERAL (
         SELECT customer_name, customer_email FROM contract_acceptances
         WHERE reservation_id = m.id ORDER BY id DESC LIMIT 1
       ) ca ON true`,
      [REMAINING_REMINDER_DAYS_BEFORE]
    );

    for (const r of due.rows) {
      console.log(`[reservationFlow] Reservation ${r.id}: remaining payment reminder`);
      if (!r.email) continue;
      try {
        // Válido hasta el final del día del evento (hora de Madrid)
        const token = crypto.randomBytes(32).toString('hex');
        await query(
          `INSERT INTO payment_tokens (token, reservation_id, token_type, expires_at)
           VALUES ($1, $2, 'remaining_advance', (($3::date + 1)::timestamp AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'UTC')`,
          [token, r.id, r.event_date]
        );
        const baseUrl = process.env.NEXTAUTH_URL || 'https://www.happyhub.es';
        await sendEmail({
          to: r.email,
          ...remainingPaymentReminderEmail({
            name: r.name || '',
            code: buildReservationCode(r.event_date, r.id),
            date: r.event_date,
            timeSlot: r.time_slot,
            totalPrice: Number(r.total_price) || 0,
            depositPaid: Number(r.deposit_paid) || 0,
            payUrl: `${baseUrl}/pagar/${token}`,
          }),
        });
      } catch (err) {
        console.error('[reservationFlow] Error sending remaining payment reminder', r.id, err);
      }
    }
    return due.rows.length;
  } catch (err) {
    console.error('[reservationFlow] Error sending remaining payment reminders:', err);
    return 0;
  }
}

/** Primero cancela (reservas ya avisadas y vencidas) y después avisa: nunca se avisa y cancela en la misma pasada */
export async function processUnpaidReservations(): Promise<{ cancelled: number; reminded: number; remainingReminded: number }> {
  const cancelled = await expireUnpaidReservations();
  const reminded = await sendDepositReminders();
  const remainingReminded = await sendRemainingPaymentReminders();
  return { cancelled, reminded, remainingReminded };
}
