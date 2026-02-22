import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  'cumpleaños': 'Cumpleaños',
  'celebracion-familiar': 'Celebración familiar',
  'eventos-amigos': 'Eventos con amigos',
  'eventos-colegio-trabajo': 'Eventos colegio/trabajo',
  'taller': 'Taller',
  'otros': 'Otros',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dateFrom, dateTo, format = 'csv' } = req.query;

  try {
    // Get all checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    let filteredSessions = sessions.data.filter(s => s.payment_status === 'paid');

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

    // Sort by date
    filteredSessions.sort((a, b) => {
      const dateA = a.metadata?.date ? new Date(a.metadata.date).getTime() : 0;
      const dateB = b.metadata?.date ? new Date(b.metadata.date).getTime() : 0;
      return dateA - dateB;
    });

    if (format === 'json') {
      // Return JSON
      const data = filteredSessions.map(s => ({
        reservationId: s.metadata?.reservationId,
        name: s.metadata?.name,
        email: s.metadata?.email || s.customer_email,
        phone: s.metadata?.phone,
        date: s.metadata?.date,
        timeSlot: TIME_SLOT_LABELS[s.metadata?.timeSlot || ''] || s.metadata?.timeSlot,
        guests: parseInt(s.metadata?.guests || '0'),
        eventType: EVENT_TYPE_LABELS[s.metadata?.eventType || ''] || s.metadata?.eventType,
        extras: s.metadata?.extras || '',
        totalPrice: parseFloat(s.metadata?.totalPrice || '0'),
        depositPaid: s.amount_total ? s.amount_total / 100 : 0,
        createdAt: new Date(s.created * 1000).toISOString(),
      }));

      return res.status(200).json(data);
    }

    // Generate CSV
    const headers = [
      'Nº Reserva',
      'Nombre',
      'Email',
      'Teléfono',
      'Fecha Evento',
      'Horario',
      'Invitados',
      'Tipo Evento',
      'Servicios Extras',
      'Precio Total (€)',
      'Señal Pagada (€)',
      'Fecha Reserva',
    ];

    const rows = filteredSessions.map(s => [
      s.metadata?.reservationId || '',
      s.metadata?.name || '',
      s.metadata?.email || s.customer_email || '',
      s.metadata?.phone || '',
      s.metadata?.date || '',
      TIME_SLOT_LABELS[s.metadata?.timeSlot || ''] || s.metadata?.timeSlot || '',
      s.metadata?.guests || '0',
      EVENT_TYPE_LABELS[s.metadata?.eventType || ''] || s.metadata?.eventType || '',
      s.metadata?.extras || '',
      s.metadata?.totalPrice || '0',
      s.amount_total ? (s.amount_total / 100).toString() : '0',
      new Date(s.created * 1000).toLocaleDateString('es-ES'),
    ]);

    // Escape CSV fields
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reservas-happyhub-${new Date().toISOString().split('T')[0]}.csv"`
    );

    return res.status(200).send(csvWithBom);
  } catch (error: any) {
    console.error('Error exporting reservations:', error);
    return res.status(500).json({
      error: error.message || 'Error exporting reservations',
    });
  }
}
