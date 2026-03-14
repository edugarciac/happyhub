import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { queryOne, query } from '@/lib/db';
import { updateUserPassword } from '@/utils/db/users';

const confirmResetSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe contener letras')
    .regex(/[0-9]/, 'La contraseña debe contener números'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { token, newPassword } = confirmResetSchema.parse(req.body);

    // Find valid token
    const resetToken = await queryOne<{
      id: number;
      user_id: number;
      expires_at: Date;
      used: boolean;
    }>(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (!resetToken) {
      return res.status(400).json({
        error: 'Este enlace de restablecimiento no es válido. Por favor, solicita uno nuevo',
      });
    }

    if (resetToken.used) {
      return res.status(400).json({
        error: 'Este enlace ya fue utilizado. Por favor, solicita uno nuevo',
      });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'Este enlace de restablecimiento ha expirado. Por favor, solicita uno nuevo',
      });
    }

    // Update password
    await updateUserPassword(resetToken.user_id, newPassword);

    // Mark token as used
    await query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetToken.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Confirm reset error:', error);
    return res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
}
