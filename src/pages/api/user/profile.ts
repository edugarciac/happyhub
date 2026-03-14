import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById, updateUserProfile, updateUserPassword, verifyPassword } from '@/utils/db/users';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Número de teléfono inválido').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe contener letras')
    .regex(/[0-9]/, 'La contraseña debe contener números')
    .optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const userId = parseInt((session.user as any).id as string, 10);

  if (req.method === 'GET') {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      authMethods: {
        password: !!user.password_hash,
        google: (session.user as any).authMethod === 'google',
      },
    });
  }

  if (req.method === 'PATCH') {
    try {
      const data = updateProfileSchema.parse(req.body);

      // Handle password change
      if (data.newPassword) {
        const user = await getUserById(userId);
        if (!user) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // If user has a password, require current password
        if (user.password_hash && user.password_hash !== '') {
          if (!data.currentPassword) {
            return res.status(400).json({ error: 'La contraseña actual es obligatoria' });
          }
          const verified = await verifyPassword(user.email, data.currentPassword);
          if (!verified) {
            return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
          }
        }

        await updateUserPassword(userId, data.newPassword);
      }

      // Handle profile update (name/phone)
      if (data.name || data.phone) {
        const updated = await updateUserProfile(userId, {
          name: data.name,
          phone: data.phone,
        });
        if (!updated) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.status(200).json(updated);
      }

      return res.status(200).json({ success: true, message: 'Perfil actualizado correctamente' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
