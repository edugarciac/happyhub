import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { buildReservationCode, extraChargeEmail } from '@/lib/emailTemplates';
import { chargeConceptLabel, type ChargeInput, type ChargeStatus } from '@/utils/charges';

// Aplica la migración 033 de forma idempotente, una vez por instancia
let tableReady: Promise<void> | null = null;
export function ensureReservationChargesTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await query(`CREATE TABLE IF NOT EXISTS reservation_charges (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        concept VARCHAR(20) NOT NULL,
        hours INTEGER,
        description TEXT NOT NULL DEFAULT '',
        amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        token VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        stripe_session_id VARCHAR(255),
        paid_method VARCHAR(20),
        created_by VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        paid_at TIMESTAMPTZ
      )`);
      await query('CREATE INDEX IF NOT EXISTS idx_reservation_charges_reservation ON reservation_charges(reservation_id)');
    })().catch((err) => {
      tableReady = null; // reintentar en la siguiente petición
      throw err;
    });
  }
  return tableReady;
}

export interface ReservationCharge {
  id: number;
  concept: string;
  hours: number | null;
  description: string;
  label: string;
  amount: number;
  status: ChargeStatus;
  url: string;
  expiresAt: string;
  paidMethod: string | null;
  createdAt: string;
  paidAt: string | null;
}

export function chargePayUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.happyhub.es';
  return `${baseUrl}/pagar/cargo/${token}`;
}

function toCharge(row: any): ReservationCharge {
  return {
    id: row.id,
    concept: row.concept,
    hours: row.hours ?? null,
    description: row.description || '',
    label: chargeConceptLabel(row),
    amount: parseFloat(row.amount),
    status: row.status,
    url: chargePayUrl(row.token),
    expiresAt: new Date(row.expires_at).toISOString(),
    paidMethod: row.paid_method || null,
    createdAt: new Date(row.created_at).toISOString(),
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
  };
}

export async function listReservationCharges(reservationId: number): Promise<ReservationCharge[]> {
  await ensureReservationChargesTable();
  const result = await query('SELECT * FROM reservation_charges WHERE reservation_id = $1 ORDER BY id DESC', [reservationId]);
  return result.rows.map(toCharge);
}

/** Datos de la reserva y del cliente (cuenta o, si no tiene, la aceptación de los términos) */
export async function getChargeReservation(reservationId: number) {
  return queryOne<{
    id: number;
    status: string;
    event_date: string;
    time_slot: string;
    name: string | null;
    email: string | null;
  }>(
    `SELECT r.id, r.status, TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot,
            COALESCE(u.name, ca.customer_name) AS name, COALESCE(u.email, ca.customer_email) AS email
     FROM reservations r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN LATERAL (
       SELECT customer_name, customer_email FROM contract_acceptances
       WHERE reservation_id = r.id ORDER BY id DESC LIMIT 1
     ) ca ON true
     WHERE r.id = $1`,
    [reservationId]
  );
}

/**
 * Crea el cobro y envía el enlace al email de la reserva. El enlace vale hasta el final del día
 * del evento, y como mínimo 72 h. Si no hay email (o falla el envío) el cobro se mantiene.
 */
export async function createReservationCharge(
  reservationId: number,
  input: ChargeInput,
  createdBy: string
): Promise<{ charge: ReservationCharge; emailSent: boolean; noEmail: boolean } | { error: string; status: number }> {
  await ensureReservationChargesTable();
  const reservation = await getChargeReservation(reservationId);
  if (!reservation) return { error: 'Reserva no encontrada', status: 404 };
  if (!['pending', 'approved', 'confirmed'].includes(reservation.status)) {
    return { error: 'No se pueden crear cobros en una reserva cancelada o rechazada', status: 400 };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const row = await queryOne(
    `INSERT INTO reservation_charges (reservation_id, concept, hours, description, amount, token, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6,
             GREATEST(NOW() + interval '72 hours', ($7::date + 1)::timestamp AT TIME ZONE 'Europe/Madrid'), $8)
     RETURNING *`,
    [reservationId, input.concept, input.hours, input.description, input.amount, token, reservation.event_date, createdBy]
  );
  const charge = toCharge(row);

  if (!reservation.email) return { charge, emailSent: false, noEmail: true };
  const emailSent = await sendEmail({
    to: reservation.email,
    ...extraChargeEmail({
      name: reservation.name || '',
      code: buildReservationCode(reservation.event_date, reservationId),
      date: reservation.event_date,
      timeSlot: reservation.time_slot,
      concept: charge.label,
      amount: charge.amount,
      payUrl: charge.url,
      expiresAt: new Date(charge.expiresAt),
    }),
  }).catch((err) => {
    console.error('[reservationCharges] Error sending charge email', charge.id, err);
    return false;
  });
  return { charge, emailSent: !!emailSent, noEmail: false };
}
