import type { NextApiRequest, NextApiResponse } from 'next';
import { buildCalendarFeed, isValidCalendarFeedToken } from '@/lib/calendarFeed';

/** Calendario de suscripción: /api/calendar/<token>.ics (Google Calendar, Apple Calendar...) */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).end();
  }
  const file = String(req.query.file || '');
  const token = file.replace(/\.ics$/i, '');
  if (!isValidCalendarFeedToken(token)) {
    return res.status(404).end();
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;
    const ics = await buildCalendarFeed(baseUrl);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="happyhub-reservas.ics"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(req.method === 'HEAD' ? '' : ics);
  } catch (error) {
    console.error('Error generando el calendario .ics:', error);
    return res.status(500).end();
  }
}
