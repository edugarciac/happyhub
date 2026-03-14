import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../../../lib/db';
import { verifyAdminToken } from '../../../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = verifyAdminToken(req);
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
    const reservation = await queryOne('SELECT * FROM reservations WHERE id = $1', [id]);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }
    return res.status(200).json({ success: true, reservation });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener la reserva' });
  }
}

async function handlePatch(id: number, req: NextApiRequest, res: NextApiResponse) {
  try {
    const existing = await queryOne('SELECT id FROM reservations WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const { eventDate, timeSlot, eventType, guests, totalPrice, depositAmount, securityDeposit, notes } = req.body;

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

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (eventDate !== undefined) { sets.push(`event_date = $${idx++}`); params.push(eventDate); }
    if (timeSlot !== undefined) { sets.push(`time_slot = $${idx++}`); params.push(timeSlot); }
    if (eventType !== undefined) { sets.push(`event_type = $${idx++}`); params.push(eventType); }
    if (guests !== undefined) { sets.push(`guests = $${idx++}`); params.push(guests); }
    if (totalPrice !== undefined) { sets.push(`total_price = $${idx++}`); params.push(totalPrice); }
    if (depositAmount !== undefined) { sets.push(`deposit_amount = $${idx++}`); params.push(depositAmount); }
    if (securityDeposit !== undefined) { sets.push(`security_deposit = $${idx++}`); params.push(securityDeposit); }
    if (notes !== undefined) { sets.push(`customer_message = $${idx++}`); params.push(notes); }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, error: 'No se proporcionaron campos para actualizar' });
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const updated = await queryOne(
      `UPDATE reservations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

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
