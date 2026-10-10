import type { NextApiRequest, NextApiResponse } from 'next';
import { expireUnpaidReservations } from '@/lib/reservationFlow';

// Cron diario de Vercel (vercel.json). Respaldo de la caducidad que también se ejecuta
// al cargar la disponibilidad y al crear reservas. Idempotente: solo cancela reservas ya vencidas.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const cancelled = await expireUnpaidReservations();
  return res.status(200).json({ success: true, cancelled });
}
