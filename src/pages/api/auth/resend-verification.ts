import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getUserById } from '../../../utils/db/users';
import { generateVerificationToken } from '../../../utils/emailVerification';
import { sendVerificationEmail } from '../../../lib/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metodo no permitido' });
  }

  // Check auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  let decoded: { userId: number; email: string; role: string; emailVerified?: boolean };
  try {
    decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as any;
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalido o expirado' });
  }

  try {
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'already_verified',
        message: 'Tu email ya esta verificado',
      });
    }

    // Generate new token (invalidates previous ones) and send email
    const token = await generateVerificationToken(user.id);
    await sendVerificationEmail(user.email, user.name, token);

    return res.status(200).json({
      success: true,
      message: 'Email de verificacion reenviado',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al reenviar el email de verificacion',
    });
  }
}
