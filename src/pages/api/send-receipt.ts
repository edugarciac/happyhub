import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import axios from 'axios';
import { Readable } from 'stream';
import type { ReceiptData } from './scan-receipt';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

interface SendReceiptRequest {
  destination: 'drive' | 'n8n';
  receiptData: ReceiptData;
  image: string;
  mimeType: string;
  fileName: string;
}

function buildReceiptText(data: ReceiptData): string {
  const lines: string[] = [];
  lines.push('=== TICKET / FACTURA ===');
  lines.push(`Proveedor: ${data.vendor}`);
  lines.push(`Fecha: ${data.date}`);
  if (data.invoiceNumber) lines.push(`Nº Factura: ${data.invoiceNumber}`);
  lines.push('');
  lines.push('ARTÍCULOS:');
  for (const item of data.items) {
    lines.push(`  ${item.description}`);
    if (item.quantity) lines.push(`    Cantidad: ${item.quantity}`);
    if (item.unitPrice) lines.push(`    Precio unitario: ${item.unitPrice}`);
    lines.push(`    Total: ${item.total}`);
  }
  lines.push('');
  if (data.subtotal) lines.push(`Subtotal: ${data.subtotal}`);
  if (data.taxRate) lines.push(`IVA (${data.taxRate}): ${data.tax}`);
  lines.push(`TOTAL: ${data.total}`);
  if (data.paymentMethod) lines.push(`Método de pago: ${data.paymentMethod}`);
  if (data.notes) lines.push(`Notas: ${data.notes}`);
  lines.push('');
  lines.push(`Escaneado: ${new Date().toLocaleString('es-ES')}`);
  return lines.join('\n');
}

async function sendToGoogleDrive(
  image: string,
  mimeType: string,
  fileName: string,
  receiptData: ReceiptData
): Promise<{ fileId: string; webViewLink: string }> {
  const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_DRIVE_RECEIPTS_FOLDER_ID } = process.env;

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Drive credentials not configured (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

  // Upload the image
  const imageBuffer = Buffer.from(image, 'base64');
  const imageStream = Readable.from(imageBuffer);
  const imageFile = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: GOOGLE_DRIVE_RECEIPTS_FOLDER_ID ? [GOOGLE_DRIVE_RECEIPTS_FOLDER_ID] : undefined,
    },
    media: {
      mimeType,
      body: imageStream,
    },
    fields: 'id, webViewLink',
  });

  const fileId = imageFile.data.id!;

  // Make file readable by anyone with the link (optional convenience)
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Upload the text summary alongside the image
  const textName = fileName.replace(/\.[^.]+$/, '') + '_datos.txt';
  const textContent = buildReceiptText(receiptData);
  const textStream = Readable.from(Buffer.from(textContent, 'utf-8'));
  await drive.files.create({
    requestBody: {
      name: textName,
      mimeType: 'text/plain',
      parents: GOOGLE_DRIVE_RECEIPTS_FOLDER_ID ? [GOOGLE_DRIVE_RECEIPTS_FOLDER_ID] : undefined,
    },
    media: {
      mimeType: 'text/plain',
      body: textStream,
    },
  });

  return {
    fileId,
    webViewLink: imageFile.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
  };
}

async function sendToN8n(
  image: string,
  mimeType: string,
  fileName: string,
  receiptData: ReceiptData
): Promise<void> {
  const webhookUrl = process.env.N8N_RECEIPT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('N8N_RECEIPT_WEBHOOK_URL not configured');
  }

  await axios.post(
    webhookUrl,
    {
      type: 'receipt',
      fileName,
      mimeType,
      imageBase64: image,
      receiptData,
      timestamp: new Date().toISOString(),
      source: 'receipt-scanner',
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    }
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { destination, receiptData, image, mimeType, fileName } = req.body as SendReceiptRequest;

  if (!destination || !receiptData || !image) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (destination === 'drive') {
    const result = await sendToGoogleDrive(image, mimeType, fileName, receiptData);
    return res.status(200).json({ success: true, destination: 'drive', ...result });
  }

  if (destination === 'n8n') {
    await sendToN8n(image, mimeType, fileName, receiptData);
    return res.status(200).json({ success: true, destination: 'n8n' });
  }

  return res.status(400).json({ error: 'Invalid destination. Use "drive" or "n8n"' });
}
