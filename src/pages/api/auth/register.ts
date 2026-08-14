import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createUser, getUserByEmail } from '../../../utils/db/users';
import { linkParticipantsToUser } from '../../../utils/db/collaborative-events';
import jwt from 'jsonwebtoken';
import { generateVerificationToken } from '../../../utils/emailVerification';
import { sendVerificationEmail } from '../../../lib/email';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
}

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

    // Create user (email_verified = false by default)
    const user = await createUser(data);

    // Link any pre-existing anonymous/RSVP-only guest rows to this new account.
    // Best-effort: must not fail registration if it errors.
    try {
      await linkParticipantsToUser(user.id, user.email);
    } catch (linkError) {
      console.error('Failed to link participants on registration:', linkError);
    }

    // Generate verification token and send email
    const verificationToken = await generateVerificationToken(user.id);
    await sendVerificationEmail(user.email, user.name, verificationToken);

    // Generate JWT with emailVerified: false
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, emailVerified: false },
      getJwtSecret(),
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
