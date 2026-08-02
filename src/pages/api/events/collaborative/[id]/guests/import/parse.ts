import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { z } from 'zod';
import ExcelJS from 'exceljs';

const parseSchema = z.object({
  fileBase64: z.string().min(1),
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { isOrganizer } = ctx;
  if (!isOrganizer) return res.status(403).json({ error: 'Sin permisos' });

  const parsed = parseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'fileBase64 requerido' });

  try {
    const base64 = parsed.data.fileBase64.includes(',')
      ? parsed.data.fileBase64.split(',')[1]
      : parsed.data.fileBase64;
    const buffer = Buffer.from(base64, 'base64');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return res.status(400).json({ error: 'Excel sin hojas de datos' });

    let headerRow: ExcelJS.Row | null = null;
    let nameCol = -1;
    let emailCol = -1;

    worksheet.eachRow((row, rowNumber) => {
      if (headerRow) return;
      const values = (row.values as any[]).map((v) => String(v ?? '').toLowerCase().trim());
      const nIdx = values.findIndex((v) => v === 'nombre' || v === 'name');
      const eIdx = values.findIndex((v) => v === 'email');
      if (nIdx > -1) {
        headerRow = row;
        nameCol = nIdx;
        emailCol = eIdx;
      }
    });

    if (nameCol === -1) {
      return res.status(400).json({ error: 'No se encontró columna "nombre" o "name" en el Excel' });
    }

    const rows: { name: string; email: string | null; status: 'ok' | 'no_email' | 'invalid_email' }[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (row === headerRow) return;
      const values = row.values as any[];
      const name = String(values[nameCol] ?? '').trim();
      if (!name) return;

      const rawEmail = emailCol > -1 ? String(values[emailCol] ?? '').trim() : '';
      let email: string | null = null;
      let status: 'ok' | 'no_email' | 'invalid_email' = 'ok';

      if (!rawEmail) {
        status = 'no_email';
      } else if (!EMAIL_REGEX.test(rawEmail)) {
        status = 'invalid_email';
        email = rawEmail;
      } else {
        email = rawEmail;
        status = 'ok';
      }

      rows.push({ name, email, status });
    });

    return res.status(200).json({ rows });
  } catch (err: any) {
    return res.status(400).json({ error: 'No se pudo leer el archivo Excel: ' + err.message });
  }
});
