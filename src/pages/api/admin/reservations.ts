import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    status = 'all', // 'all', 'paid', 'pending'
    dateFrom,
    dateTo,
    search,
    limit = '50',
    offset = '0',
  } = req.query;

  try {
    // Get checkout sessions with pagination
    const sessions = await stripe.checkout.sessions.list({
      limit: 100, // Get more to filter
    });

    let filteredSessions = sessions.data;

    // Filter by payment status
    if (status === 'paid') {
      filteredSessions = filteredSessions.filter(s => s.payment_status === 'paid');
    } else if (status === 'pending') {
      filteredSessions = filteredSessions.filter(s => s.payment_status !== 'paid');
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      filteredSessions = filteredSessions.filter(s => {
        if (!s.metadata?.date) return false;
        return new Date(s.metadata.date) >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      filteredSessions = filteredSessions.filter(s => {
        if (!s.metadata?.date) return false;
        return new Date(s.metadata.date) <= toDate;
      });
    }

    // Filter by search query
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredSessions = filteredSessions.filter(s => {
        const metadata = s.metadata;
        if (!metadata) return false;
        return (
          metadata.name?.toLowerCase().includes(searchLower) ||
          metadata.email?.toLowerCase().includes(searchLower) ||
          metadata.phone?.includes(search) ||
          metadata.reservationId?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by event date (newest first)
    filteredSessions.sort((a, b) => {
      const dateA = a.metadata?.date ? new Date(a.metadata.date).getTime() : 0;
      const dateB = b.metadata?.date ? new Date(b.metadata.date).getTime() : 0;
      return dateB - dateA;
    });

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedSessions = filteredSessions.slice(offsetNum, offsetNum + limitNum);

    // Map to reservation objects
    const reservations = paginatedSessions.map(session => ({
      id: session.id,
      reservationId: session.metadata?.reservationId || session.id,
      name: session.metadata?.name || 'N/A',
      email: session.metadata?.email || session.customer_email || 'N/A',
      phone: session.metadata?.phone || 'N/A',
      date: session.metadata?.date || null,
      timeSlot: session.metadata?.timeSlot || 'N/A',
      guests: parseInt(session.metadata?.guests || '0'),
      eventType: session.metadata?.eventType || 'N/A',
      extras: session.metadata?.extras ? session.metadata.extras.split(',').filter(Boolean) : [],
      basePrice: parseFloat(session.metadata?.basePrice || '0'),
      totalPrice: parseFloat(session.metadata?.totalPrice || '0'),
      depositAmount: parseFloat(session.metadata?.depositAmount || '0'),
      depositPaid: session.amount_total ? session.amount_total / 100 : 0,
      paymentStatus: session.payment_status,
      message: session.metadata?.message || '',
      createdAt: new Date(session.created * 1000).toISOString(),
    }));

    return res.status(200).json({
      total: filteredSessions.length,
      limit: limitNum,
      offset: offsetNum,
      reservations,
    });
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return res.status(500).json({
      error: error.message || 'Error fetching reservations',
    });
  }
}
