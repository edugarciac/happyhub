import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';
import ExcelJS from 'exceljs';

const parseSchema = z.object({
  fileBase64: z.string().min(1),
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Sin permisos' });

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
}
