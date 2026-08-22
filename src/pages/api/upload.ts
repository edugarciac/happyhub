import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { uploadToS3 } from '../../lib/s3';

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
    const { file, folder = 'uploads' } = req.body as {
      file: { name: string; data: string; type: string };
      folder?: string;
    };

    if (!file || !file.data || !file.name) {
      return res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
    }

    if (!file.type?.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'Solo se permiten imágenes' });
    }

    const buffer = Buffer.from(file.data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'La imagen debe ser menor a 5MB' });
    }

    const allowedFolders = ['services', 'event-types', 'reviews', 'uploads', 'custom-details'];
    const safeFolder = allowedFolders.includes(folder) ? folder : 'uploads';

    const url = await uploadToS3(file.data, safeFolder, file.name);

    return res.status(200).json({ success: true, url });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ success: false, error: 'Error al subir archivo' });
  }
}
