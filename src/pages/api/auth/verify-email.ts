import type { NextApiRequest, NextApiResponse } from 'next';
import { validateVerificationToken } from '../../../utils/emailVerification';
import { getUserById } from '../../../utils/db/users';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metodo no permitido' });
  }

  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'invalid',
      message: 'Enlace de verificacion no valido',
    });
  }

  try {
    const result = await validateVerificationToken(token);

    if (!result.valid) {
      const messages: Record<string, string> = {
        expired: 'Este enlace ha caducado. Solicita uno nuevo',
        used: 'Este email ya ha sido verificado',
        invalid: 'Enlace de verificacion no valido',
      };

      return res.status(400).json({
        success: false,
        error: result.error,
        message: messages[result.error || 'invalid'],
      });
    }

    // Get updated user to generate new JWT
    const user = await getUserById(result.userId!);
    if (!user) {
      return res.status(404).json({ success: false, error: 'user_not_found' });
    }

    // Generate new JWT with emailVerified: true
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, emailVerified: true },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Email verificado correctamente',
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: true,
      },
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Error al verificar el email. Intenta de nuevo',
    });
  }
}
