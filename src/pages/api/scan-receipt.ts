import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export interface ReceiptData {
  vendor: string;
  date: string;
  invoiceNumber: string;
  items: Array<{ description: string; quantity: string; unitPrice: string; total: string }>;
  subtotal: string;
  tax: string;
  taxRate: string;
  total: string;
  paymentMethod: string;
  notes: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mimeType } = req.body as { image: string; mimeType: string };

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' });
  }

  const client = new Anthropic({ apiKey });

  const validMimeType = (mimeType as string) || 'image/jpeg';
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const mediaType = supportedTypes.includes(validMimeType)
    ? (validMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
    : 'image/jpeg';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: image,
            },
          },
          {
            type: 'text',
            text: `Analiza este ticket o factura y extrae la información estructurada. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con este formato exacto:
{
  "vendor": "nombre del comercio/proveedor",
  "date": "fecha en formato DD/MM/YYYY o vacío si no se ve",
  "invoiceNumber": "número de factura/ticket o vacío",
  "items": [
    {
      "description": "descripción del artículo/servicio",
      "quantity": "cantidad",
      "unitPrice": "precio unitario con símbolo de moneda",
      "total": "total línea con símbolo de moneda"
    }
  ],
  "subtotal": "subtotal con símbolo de moneda o vacío",
  "tax": "importe IVA con símbolo de moneda o vacío",
  "taxRate": "porcentaje IVA ej: 21% o vacío",
  "total": "total final con símbolo de moneda",
  "paymentMethod": "método de pago o vacío",
  "notes": "cualquier otra información relevante o vacío"
}
Si algún campo no es visible, usa cadena vacía. Extrae todos los artículos/líneas que veas.`,
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    return res.status(500).json({ error: 'Unexpected response from Claude' });
  }

  const jsonText = content.text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

  const receiptData: ReceiptData = JSON.parse(jsonText);
  return res.status(200).json({ success: true, data: receiptData });
}
