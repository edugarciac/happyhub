import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createUser, getUserByEmail } from '../../../utils/db/users';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const registerSchema = z.object({
  email: z.string().email('Por favor, introduce una dirección de email válida'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe contener letras')
    .regex(/[0-9]/, 'La contraseña debe contener números'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Por favor, introduce un número de teléfono válido'),
});

interface RegisterResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    // Validate request data
    const data = registerSchema.parse(req.body);

    // Check if email already exists
    const existing = await getUserByEmail(data.email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Este email ya está registrado. Por favor, inicia sesión o usa otro email',
      });
    }

    // Create user
    const user = await createUser(data);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error('Registration error:', error);

    // Specific database errors
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Este email ya está registrado. Por favor, usa otro email o inicia sesión',
      });
    }

    if (error.code === '23502') {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios. Verifica nombre, email, teléfono y contraseña',
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Error de referencia en base de datos. Contacta con soporte',
      });
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Error de conexión con la base de datos. Intenta de nuevo en unos segundos',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: `Error de validación: ${error.message}`,
      });
    }

    // Generic fallback with more context
    return res.status(500).json({
      success: false,
      error: `Error al crear la cuenta: ${error.message || 'Error desconocido'}. Contacta con soporte si persiste`,
    });
  }
}
