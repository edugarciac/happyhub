import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../../../lib/db';
import { verifyAdminSession } from '../../../../../utils/adminAuth';
import { getContractAcceptance } from '../../../../../lib/contractAcceptance';
import { ensureReservationFlowColumns } from '../../../../../lib/reservationFlow';
import { parseReservationExtras, resolveReservationExtras } from '../../../../../lib/reservationExtras';
import { updateReservationEventTimes } from '../../../../../lib/googleCalendar';
import { isValidExtraHours } from '../../../../../utils/pricing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'ID de reserva invalido' });
  }
  const reservationId = parseInt(id);

  if (req.method === 'GET') {
    return handleGet(reservationId, res);
  } else if (req.method === 'PATCH') {
    return handlePatch(reservationId, req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(reservationId, res);
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGet(id: number, res: NextApiResponse) {
  try {
    const reservation = await queryOne(
      `SELECT r.*, u.name, u.email, u.phone
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }
    const acceptance = await getContractAcceptance(id);
    return res.status(200).json({ success: true, reservation, acceptance });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener la reserva' });
  }
}

async function handlePatch(id: number, req: NextApiRequest, res: NextApiResponse) {
  try {
    await ensureReservationFlowColumns();
    const existing = await queryOne<{
      event_date: string;
      time_slot: string;
      extra_hours: number | null;
      extras: unknown;
      google_calendar_event_id: string | null;
    }>(
      `SELECT TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, time_slot, extra_hours, extras, google_calendar_event_id
       FROM reservations WHERE id = $1`,
      [id]
    );
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const { eventDate, timeSlot, eventType, guests, totalPrice, depositAmount, securityDeposit, notes, needsKidsFurniture, extraHours, extraIds } = req.body;

    if (eventDate) {
      const d = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) {
        return res.status(400).json({ success: false, error: 'La fecha no puede ser anterior a hoy' });
      }
    }
    if (guests !== undefined && (guests < 1 || guests > 150)) {
      return res.status(400).json({ success: false, error: 'Invitados debe ser entre 1 y 150' });
    }
    if (totalPrice !== undefined && totalPrice < 0) {
      return res.status(400).json({ success: false, error: 'El precio no puede ser negativo' });
    }

    const nextTimeSlot = timeSlot ?? existing.time_slot;
    const nextExtraHours = extraHours ?? (Number(existing.extra_hours) || 0);
    if (!isValidExtraHours(nextTimeSlot, nextExtraHours)) {
      return res.status(400).json({ success: false, error: 'Horas adicionales no válidas (0–3, solo en la franja de tarde)' });
    }
    let extras;
    if (extraIds !== undefined) {
      extras = await resolveReservationExtras(extraIds, parseReservationExtras(existing.extras));
      if (!extras) {
        return res.status(400).json({ success: false, error: 'Alguno de los servicios seleccionados no existe o no está activo' });
      }
    }

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (eventDate !== undefined) { sets.push(`event_date = $${idx++}`); params.push(eventDate); }
    if (timeSlot !== undefined) { sets.push(`time_slot = $${idx++}`); params.push(timeSlot); }
    if (eventType !== undefined) { sets.push(`event_type = $${idx++}`); params.push(eventType); }
    if (guests !== undefined) { sets.push(`guests = $${idx++}`); params.push(guests); }
    if (totalPrice !== undefined) { sets.push(`total_price = $${idx++}`); params.push(totalPrice); }
    if (depositAmount !== undefined) { sets.push(`deposit_amount = $${idx++}`); params.push(depositAmount); }
    if (notes !== undefined) { sets.push(`notes = $${idx++}`); params.push(notes); }
    if (needsKidsFurniture !== undefined) { sets.push(`needs_kids_furniture = $${idx++}`); params.push(needsKidsFurniture); }
    if (extraHours !== undefined) { sets.push(`extra_hours = $${idx++}`); params.push(extraHours); }
    if (extras !== undefined) { sets.push(`extras = $${idx++}::jsonb`); params.push(JSON.stringify(extras)); }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, error: 'No se proporcionaron campos para actualizar' });
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const updated = await queryOne(
      `UPDATE reservations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    // El evento de Calendar sigue a la fecha, la franja y las horas adicionales
    const nextDate = eventDate ? String(eventDate).split('T')[0] : existing.event_date;
    const timesChanged =
      nextDate !== existing.event_date || nextTimeSlot !== existing.time_slot || nextExtraHours !== (Number(existing.extra_hours) || 0);
    if (timesChanged && existing.google_calendar_event_id) {
      await updateReservationEventTimes(existing.google_calendar_event_id, {
        date: nextDate,
        timeSlot: nextTimeSlot,
        extraHours: nextExtraHours,
      });
    }

    return res.status(200).json({ success: true, reservation: updated });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar la reserva' });
  }
}

async function handleDelete(id: number, res: NextApiResponse) {
  try {
    const result = await query('DELETE FROM reservations WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar la reserva' });
  }
}
