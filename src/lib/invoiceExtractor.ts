import Anthropic from '@anthropic-ai/sdk';

export interface ExtractedInvoice {
  numeroFactura: string;
  fecha: string;
  proveedor: string;
  nifCif: string;
  concepto: string;
  baseImponible: string;
  porcentajeIva: string;
  cuotaIva: string;
  total: string;
  formaPago: string;
  categoria: string;
  notas: string;
}

const EXTRACTION_PROMPT = `Extrae los datos de esta factura o recibo y devuelve un JSON con exactamente estos campos:

{
  "numeroFactura": "número de factura o referencia (string)",
  "fecha": "fecha en formato DD/MM/YYYY",
  "proveedor": "nombre del emisor/proveedor",
  "nifCif": "NIF, CIF o número de identificación fiscal",
  "concepto": "descripción breve del servicio o producto",
  "baseImponible": "importe sin IVA como número con 2 decimales (ej: 100.00)",
  "porcentajeIva": "porcentaje de IVA sin símbolo % (ej: 21)",
  "cuotaIva": "importe del IVA como número con 2 decimales (ej: 21.00)",
  "total": "importe total como número con 2 decimales (ej: 121.00)",
  "formaPago": "forma de pago (Transferencia, Tarjeta, Efectivo, Domiciliación, etc.)",
  "categoria": "categoría del gasto (Material de Oficina, Servicios Profesionales, Alimentación, Transporte, Limpieza, Marketing, Utilities, Otro)",
  "notas": "información adicional relevante si la hay, si no deja vacío"
}

Si algún campo no está disponible o no se puede determinar, usa "" para strings o "0.00" para importes numéricos.
Devuelve SOLO el JSON sin texto adicional ni bloques de código.`;

export async function extractInvoiceData(
  base64Data: string,
  mimeType: string
): Promise<ExtractedInvoice> {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

  const isPdf = mimeType === 'application/pdf';

  const fileContent = isPdf
    ? {
        type: 'document' as const,
        source: {
          type: 'base64' as const,
          media_type: 'application/pdf' as const,
          data: base64Data,
        },
      }
    : {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: base64Data,
        },
      };

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          fileContent,
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Respuesta inesperada de Claude');

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se pudo extraer el JSON de la respuesta');

  return JSON.parse(jsonMatch[0]) as ExtractedInvoice;
}
