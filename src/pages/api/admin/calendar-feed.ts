import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminSession } from '@/utils/adminAuth';
import { calendarFeedUrl } from '@/lib/calendarFeed';

/** Enlace privado del calendario de suscripción, solo para el admin */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }
  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;
  const url = calendarFeedUrl(baseUrl);
  if (!url) {
    return res.status(500).json({ success: false, error: 'Falta NEXTAUTH_SECRET para generar el enlace del calendario' });
  }
  return res.status(200).json({ success: true, url, webcalUrl: url.replace(/^https?:\/\//, 'webcal://') });
}
