import { query } from '@/lib/db';
import { expireUnpaidReservations } from '@/lib/reservationFlow';

export interface BookedSlot {
  /** 'YYYY-MM-DD' */
  date: string;
  timeSlot: string;
}

/**
 * Franjas ocupadas desde hoy (reservas pendientes, aprobadas o confirmadas, y bloqueos del admin).
 * Con `onDate`, solo las de ese día. No devuelve datos de los clientes.
 */
export async function getBookedSlots(onDate?: string): Promise<BookedSlot[]> {
  // Liberar primero las reservas aprobadas con la señal sin pagar fuera de plazo
  await expireUnpaidReservations();

  const dateFilter = onDate ? 'AND event_date = $1::date' : '';
  const blockedFilter = onDate ? 'AND slot_date = $1::date' : '';
  const params = onDate ? [onDate] : [];

  const [reservationsResult, blockedResult] = await Promise.all([
    query<{ event_date: string; time_slot: string }>(
      `SELECT TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, time_slot
       FROM reservations
       WHERE status IN ('pending', 'approved', 'confirmed')
         AND event_date >= CURRENT_DATE ${dateFilter}`,
      params
    ),
    query<{ event_date: string; time_slot: string }>(
      `SELECT TO_CHAR(slot_date, 'YYYY-MM-DD') AS event_date, time_slot
       FROM blocked_slots
       WHERE slot_date >= CURRENT_DATE ${blockedFilter}`,
      params
    ),
  ]);

  return [...reservationsResult.rows, ...blockedResult.rows].map((row) => ({
    date: row.event_date,
    timeSlot: row.time_slot,
  }));
}
