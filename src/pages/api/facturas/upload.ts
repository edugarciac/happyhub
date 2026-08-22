import type { NextApiRequest, NextApiResponse } from 'next';
import { extractInvoiceData } from '@/lib/invoiceExtractor';
import { getMonthFolder, uploadFile, findExcelFile, saveExcelFile } from '@/lib/googleDrive';
import { addInvoiceRow } from '@/lib/excelManager';
import { requireAdminSession } from '@/utils/adminAuth';

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};

interface UploadRequest {
  filename: string;
  mimeType: string;
  data: string; // base64
}

interface UploadResponse {
  success: boolean;
  invoice?: {
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
    driveLink: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await requireAdminSession(req, res);
  } catch {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { filename, mimeType, data } = req.body as UploadRequest;

  if (!filename || !mimeType || !data) {
    return res.status(400).json({ success: false, error: 'Faltan campos: filename, mimeType, data' });
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(mimeType)) {
    return res.status(400).json({ success: false, error: `Tipo de archivo no soportado: ${mimeType}` });
  }

  if (!process.env.GOOGLE_DRIVE_FACTURAS_FOLDER_ID) {
    return res.status(500).json({ success: false, error: 'GOOGLE_DRIVE_FACTURAS_FOLDER_ID no configurado' });
  }

  if (!process.env.CLAUDE_API_KEY) {
    return res.status(500).json({ success: false, error: 'CLAUDE_API_KEY no configurado' });
  }

  try {
    // 1. Extract invoice data with Claude AI
    console.log(`Extrayendo datos de: ${filename}`);
    const extractedData = await extractInvoiceData(data, mimeType);

    // 2. Determine target month/year folder from invoice date or today
    let invoiceDate = new Date();
    if (extractedData.fecha && extractedData.fecha.match(/\d{2}\/\d{2}\/\d{4}/)) {
      const [day, month, year] = extractedData.fecha.split('/').map(Number);
      invoiceDate = new Date(year, month - 1, day);
    }
    const year = invoiceDate.getFullYear();
    const month = invoiceDate.getMonth() + 1;

    // 3. Upload invoice file to Drive month/year folder
    const fileBuffer = Buffer.from(data, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestampedName = `${Date.now()}_${safeName}`;

    const monthFolderId = await getMonthFolder(year, month);
    const { webViewLink } = await uploadFile(monthFolderId, timestampedName, mimeType, fileBuffer);

    console.log(`Archivo subido a Drive: ${webViewLink}`);

    // 4. Update master Excel in Drive root
    const existingExcel = await findExcelFile();
    const updatedBuffer = await addInvoiceRow(
      existingExcel?.buffer || null,
      extractedData,
      webViewLink
    );
    await saveExcelFile(updatedBuffer, existingExcel?.id);

    console.log('Excel actualizado en Drive');

    return res.status(200).json({
      success: true,
      invoice: { ...extractedData, driveLink: webViewLink },
    });
  } catch (error: any) {
    console.error('Error procesando factura:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar la factura',
    });
  }
}
