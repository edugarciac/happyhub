import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminSession } from '@/utils/adminAuth';
import { computeReservationPrice } from '@/lib/reservationPricing';
import { extraHoursPrice, isBookableTimeSlot, isValidExtraHours } from '@/utils/pricing';

/** Precio de una reserva manual con la tarifa vigente (mismo cálculo que la reserva web) */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdminSession(req, res);
  if (!admin) return res.status(401).json({ success: false, error: 'No autorizado' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { eventDate, timeSlot, extraIds } = req.body;
  const extraHours = req.body.extraHours ?? 0;
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(eventDate)) || !isBookableTimeSlot(timeSlot)) {
    return res.status(400).json({ success: false, error: 'Fecha o franja no válidas' });
  }
  if (!isValidExtraHours(timeSlot, extraHours)) {
    return res.status(400).json({ success: false, error: 'Horas adicionales no válidas (0–3, solo en la franja de tarde)' });
  }

  try {
    const price = await computeReservationPrice({
      date: String(eventDate),
      timeSlot,
      extraHours,
      extraIds: Array.isArray(extraIds) ? extraIds.map(String) : [],
    });
    if (!price.ok) return res.status(200).json({ success: true, consult: price.reason === 'consult', unknownExtras: price.reason === 'unknown_extras' });
    return res.status(200).json({ success: true, ...price, extraHoursPrice: extraHoursPrice(extraHours) });
  } catch (error: any) {
    console.error('Error calculando el precio de la reserva manual:', error);
    return res.status(500).json({ success: false, error: 'No se ha podido calcular el precio' });
  }
}
