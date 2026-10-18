import type { NextApiRequest, NextApiResponse } from 'next';
import { processUnpaidReservations } from '@/lib/reservationFlow';

// Cron diario de Vercel (vercel.json, 07:00 UTC); también se ejecuta al abrir el listado de reservas del admin.
// Cancela las reservas avisadas y vencidas y envía el recordatorio de la señal a las que acaban de vencer.
// Idempotente: cada reserva se avisa y se cancela una sola vez.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const result = await processUnpaidReservations();
  return res.status(200).json({ success: true, ...result });
}
