import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { sendReservationReminder } from '@/lib/whatsapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API key auth for cron jobs
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.CRON_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { days = '7' } = req.body;
  const daysAhead = parseInt(days as string);

  try {
    // Calculate target date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    // Get all paid checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.metadata'],
    });

    // Filter for reservations on the target date
    const reservationsToRemind = sessions.data.filter((session) => {
      if (session.payment_status !== 'paid' || !session.metadata?.date) {
        return false;
      }

      const reservationDate = new Date(session.metadata.date);
      reservationDate.setHours(0, 0, 0, 0);

      return reservationDate.getTime() === targetDate.getTime();
    });

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as { reservationId: string; status: string; error?: string }[],
    };

    // Send reminders
    for (const session of reservationsToRemind) {
      const metadata = session.metadata!;

      if (!metadata.phone) {
        results.skipped++;
        results.details.push({
          reservationId: metadata.reservationId,
          status: 'skipped',
          error: 'No phone number',
        });
        continue;
      }

      try {
        const sent = await sendReservationReminder({
          phone: metadata.phone,
          name: metadata.name || 'Cliente',
          date: metadata.date,
          timeSlot: metadata.timeSlot,
          reservationId: metadata.reservationId,
        });

        if (sent) {
          results.sent++;
          results.details.push({
            reservationId: metadata.reservationId,
            status: 'sent',
          });
        } else {
          results.failed++;
          results.details.push({
            reservationId: metadata.reservationId,
            status: 'failed',
            error: 'WhatsApp send returned false',
          });
        }
      } catch (error: any) {
        results.failed++;
        results.details.push({
          reservationId: metadata.reservationId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      targetDate: targetDate.toISOString(),
      daysAhead,
      totalReservations: reservationsToRemind.length,
      ...results,
    });
  } catch (error: any) {
    console.error('Error sending reminders:', error);
    return res.status(500).json({
      error: error.message || 'Error sending reminders',
    });
  }
}
