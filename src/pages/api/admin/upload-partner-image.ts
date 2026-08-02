import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from '@/utils/adminAuth';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  try {
    await requireAdminSession(req, res);
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const { image, filename } = req.body;
    if (!image || !filename) return res.status(400).json({ error: 'image y filename requeridos' });

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'partners');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // image is base64 data URL: data:image/png;base64,...
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Formato de imagen invalido' });

    const ext = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalName = `${safeName}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, finalName);

    fs.writeFileSync(filePath, data);

    return res.json({ url: `/uploads/partners/${finalName}` });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
