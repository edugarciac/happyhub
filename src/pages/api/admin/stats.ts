import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdminSession(req, res);
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: {
        gte: Math.floor(startOfMonth.getTime() / 1000),
      },
    });

    // Filter paid sessions
    const paidSessions = sessions.data.filter(s => s.payment_status === 'paid');

    // Calculate stats
    const totalReservationsThisMonth = paidSessions.length;
    const totalRevenueThisMonth = paidSessions.reduce((sum, session) => {
      return sum + (session.amount_total || 0) / 100;
    }, 0);

    // Get upcoming events (next 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const allSessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    const upcomingEvents = allSessions.data.filter(session => {
      if (session.payment_status !== 'paid' || !session.metadata?.date) {
        return false;
      }
      const eventDate = new Date(session.metadata.date);
      return eventDate >= today && eventDate <= nextWeek;
    });

    // Get pending payments (optional - from unpaid sessions)
    const pendingPayments = sessions.data.filter(s =>
      s.payment_status === 'unpaid' && s.status === 'open'
    ).length;

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthSessions = await stripe.checkout.sessions.list({
        limit: 100,
        created: {
          gte: Math.floor(monthDate.getTime() / 1000),
          lte: Math.floor(monthEnd.getTime() / 1000),
        },
      });

      const paidMonthSessions = monthSessions.data.filter(s => s.payment_status === 'paid');
      const monthRevenue = paidMonthSessions.reduce((sum, s) => sum + (s.amount_total || 0) / 100, 0);

      revenueByMonth.push({
        month: monthDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        count: paidMonthSessions.length,
      });
    }

    return res.status(200).json({
      currentMonth: {
        name: now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        reservations: totalReservationsThisMonth,
        revenue: totalRevenueThisMonth,
      },
      upcomingEvents: {
        count: upcomingEvents.length,
        events: upcomingEvents.slice(0, 5).map(s => ({
          reservationId: s.metadata?.reservationId,
          name: s.metadata?.name,
          date: s.metadata?.date,
          timeSlot: s.metadata?.timeSlot,
          guests: s.metadata?.guests,
        })),
      },
      pendingPayments,
      revenueByMonth,
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({
      error: error.message || 'Error fetching stats',
    });
  }
}
