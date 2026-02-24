import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * MOCK de n8n para testing del frontend
 * Simula la respuesta de n8n sin integraciones reales
 *
 * Para usar: cambiar N8N_WEBHOOK_URL a /api/webhook-reserva-mock
 */

interface ReservationData {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  date: string;
  time: string;
  guests: number;
  totalPrice: number;
  depositAmount: number;
}

interface ResponseData {
  success: boolean;
  message?: string;
  reservationId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const data: ReservationData = req.body;

    console.log('📥 MOCK n8n - Reserva recibida:', {
      name: data.name,
      email: data.email,
      date: data.date,
      time: data.time,
      guests: data.guests,
      total: data.totalPrice,
    });

    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generar ID de reserva simulado
    const timestamp = Date.now();
    const reservationId = `RES-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(timestamp).slice(-3)}`;

    console.log('✅ MOCK n8n - Reserva procesada:', reservationId);
    console.log('📧 MOCK - Email enviado a:', data.email);
    console.log('📱 MOCK - WhatsApp enviado a:', data.phone);
    console.log('📅 MOCK - Evento creado en Calendar');
    console.log('💾 MOCK - Guardado en BD (simulado)');

    return res.status(200).json({
      success: true,
      message: 'Reserva creada exitosamente (MOCK)',
      reservationId,
    });
  } catch (error: any) {
    console.error('❌ MOCK n8n - Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al procesar la reserva (MOCK)',
    });
  }
}
