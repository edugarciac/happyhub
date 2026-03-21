import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import fs from 'fs';
import path from 'path';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const { files } = req.body as { files: { name: string; data: string; type: string }[] };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No se proporcionaron archivos' });
    }

    if (files.length > 3) {
      return res.status(400).json({ success: false, error: 'Máximo 3 fotos permitidas' });
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads/reviews');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return res.status(400).json({ success: false, error: 'Solo se permiten imágenes' });
      }

      const buffer = Buffer.from(file.data, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: 'Cada imagen debe ser menor a 5MB' });
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, buffer);
      urls.push(`/uploads/reviews/${filename}`);
    }

    return res.status(200).json({ success: true, urls });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ success: false, error: 'Error al subir archivo' });
  }
}
