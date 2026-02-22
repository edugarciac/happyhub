import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { generateContractPDF } from '@/lib/pdf';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reservationId, session_id } = req.query;

  if (!reservationId || typeof reservationId !== 'string') {
    return res.status(400).json({ error: 'Reservation ID is required' });
  }

  try {
    let reservationData: any = null;

    // Try to find the reservation in Stripe checkout sessions
    if (session_id && typeof session_id === 'string') {
      // If session_id is provided, retrieve directly
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.metadata?.reservationId === reservationId) {
          reservationData = session.metadata;
        }
      } catch (e) {
        console.log('Session not found by ID');
      }
    }

    // If not found, search through recent sessions
    if (!reservationData) {
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        expand: ['data.metadata'],
      });

      const matchingSession = sessions.data.find(
        (s) => s.metadata?.reservationId === reservationId
      );

      if (matchingSession?.metadata) {
        reservationData = matchingSession.metadata;
      }
    }

    if (!reservationData) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Parse the reservation data
    const reservation = {
      reservationId: reservationData.reservationId,
      name: reservationData.name,
      email: reservationData.email,
      phone: reservationData.phone,
      date: reservationData.date,
      timeSlot: reservationData.timeSlot,
      guests: parseInt(reservationData.guests || '0'),
      eventType: reservationData.eventType,
      extras: reservationData.extras ? reservationData.extras.split(',').filter(Boolean) : [],
      basePrice: parseFloat(reservationData.basePrice || '0'),
      totalPrice: parseFloat(reservationData.totalPrice || '0'),
      depositAmount: parseFloat(reservationData.depositAmount || '0'),
      message: reservationData.message,
    };

    // Generate PDF
    const pdfBuffer = generateContractPDF(reservation);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="contrato-${reservationId}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating contract PDF:', error);
    return res.status(500).json({
      error: error.message || 'Error generating contract',
    });
  }
}
