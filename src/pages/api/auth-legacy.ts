import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { verifyPassword, getUserById } from '../../utils/db/users';
import { ensureUsersTable } from '../../lib/db';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  if (req.method === 'POST') {
    return handleLogin(req, res);
  }

  if (req.method === 'GET') {
    return handleVerifyToken(req, res);
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse<AuthResponse>) {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son obligatorios',
      });
    }

    // Ensure users table exists (creates it if missing, idempotent)
    await ensureUsersTable();

    // Verify user credentials against database
    const user = await verifyPassword(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error en login:', error);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Error de conexión con la base de datos. Intenta de nuevo en unos segundos',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(500).json({
        success: false,
        error: 'Error al generar token de sesión. Contacta con soporte',
      });
    }

    return res.status(500).json({
      success: false,
      error: `Error al iniciar sesión: ${error.message || 'Error desconocido'}. Contacta con soporte si persiste`,
    });
  }
}

async function handleVerifyToken(req: NextApiRequest, res: NextApiResponse<AuthResponse>) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token',
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: number;
      email: string;
      role: string;
    };

    // Verify user still exists in database
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error verificando token:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token de sesión inválido. Por favor, inicia sesión de nuevo',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Error de autenticación. Por favor, inicia sesión de nuevo',
    });
  }
}
