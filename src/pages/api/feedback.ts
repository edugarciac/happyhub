import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { sendAdminNotification } from '@/lib/whatsapp';

const postSchema = z.object({
  message: z.string().min(1).max(2000),
  pagePath: z.string().max(500).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos' });

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user ? parseInt((session.user as any).id as string, 10) || null : null;

  const result = await query(
    `INSERT INTO feedback (message, page_path, user_id) VALUES ($1, $2, $3) RETURNING id`,
    [parsed.data.message, parsed.data.pagePath || null, userId]
  );

  sendAdminNotification(
    `💬 Nuevo feedback en HappyHub${parsed.data.pagePath ? ` (${parsed.data.pagePath})` : ''}:\n\n${parsed.data.message}`
  ).catch((err) => console.error('Error sending feedback WhatsApp notification:', err));

  return res.status(201).json({ id: result.rows[0].id });
}
