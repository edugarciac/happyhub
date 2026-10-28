import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdminSession } from '@/utils/adminAuth';

const ALLOWED_FOLDERS = ['services', 'partners', 'event-types', 'reviews', 'uploads', 'custom-details'];
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Issues Vercel Blob client-upload tokens. The browser uploads the file
 * directly to Blob, so no file bytes pass through this function.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdminSession(req, res);
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const result = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const folder = pathname.split('/')[0];
        if (!ALLOWED_FOLDERS.includes(folder) || pathname.includes('..')) {
          throw new Error('Carpeta no permitida');
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error generating upload token:', error);
    const message = error instanceof Error ? error.message : 'Error al subir archivo';
    return res.status(400).json({ error: message });
  }
}
