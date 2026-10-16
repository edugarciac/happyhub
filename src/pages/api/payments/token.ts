import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Desactivado (2026-10-17): el resto se cobra el día del evento, no por adelantado.
 * Lo llamaba el recordatorio n8n de pago a 30/7/3 días (n8n-payment-reminder-cron); responder 410 corta
 * ese flujo antes de enviar el email. Los enlaces del día se generan desde el panel (Cobro del día).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res
    .status(410)
    .json({ error: 'Los recordatorios de pago anticipado están desactivados: el resto se cobra el día del evento' });
}
