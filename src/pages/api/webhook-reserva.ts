import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface ReservationData {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  date: string;
  time: string;
  guests: number;
  duration: string;
  extras?: string[];
  paymentMethod: string;
  message?: string;
  totalPrice: number;
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
    const reservationData: ReservationData = req.body;

    if (!reservationData.name || !reservationData.email || !reservationData.phone) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios',
      });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL no está configurada');
      return res.status(500).json({
        success: false,
        error: 'Error de configuración del servidor',
      });
    }

    const payload = {
      ...reservationData,
      timestamp: new Date().toISOString(),
      source: 'web',
    };

    // Si la URL es el mock, hacer request local
    if (n8nWebhookUrl.includes('/api/webhook-reserva-mock')) {
      console.log('🎭 Usando MOCK de n8n para testing');
      // Hacer request interno al mock
      const mockUrl = `${req.headers.origin || 'http://localhost:3000'}/api/webhook-reserva-mock`;
      const mockResponse = await axios.post(mockUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      const reservationId = mockResponse.data?.reservationId || `RES-${Date.now()}`;
      return res.status(200).json({
        success: true,
        message: 'Reserva creada exitosamente (MOCK)',
        reservationId,
      });
    }

    console.log('Enviando reserva a n8n:', payload);

    const n8nResponse = await axios.post(n8nWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('Respuesta de n8n:', n8nResponse.data);

    const reservationId = n8nResponse.data?.reservationId || `RES-${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: 'Reserva creada exitosamente',
      reservationId,
    });
  } catch (error: any) {
    console.error('Error al procesar la reserva:', error);

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        error: 'Servicio de reservas temporalmente no disponible',
      });
    }

    return res.status(500).json({
      success: false,
      error: error.response?.data?.message || 'Error al procesar la reserva',
    });
  }
}
