import type { NextApiRequest, NextApiResponse } from 'next';
import { findExcelFile } from '@/lib/googleDrive';
import { readInvoiceRows } from '@/lib/excelManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GOOGLE_DRIVE_FACTURAS_FOLDER_ID) {
    return res.status(200).json({ invoices: [], total: 0 });
  }

  try {
    const excelFile = await findExcelFile();
    if (!excelFile) {
      return res.status(200).json({ invoices: [], total: 0 });
    }

    const rows = await readInvoiceRows(excelFile.buffer);
    const total = rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0);

    return res.status(200).json({ invoices: rows.reverse(), total });
  } catch (error: any) {
    console.error('Error listing invoices:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
