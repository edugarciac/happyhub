import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

const DEMO_USERS = [
  {
    id: 'admin-1',
    email: 'admin@happyhub.es',
    password: '$2a$10$X5wH5mYqR5qI5HwPnT8fHuK5RqE5ZqF5qE5ZqF5qE5ZqF5qE5ZqF5q',
    name: 'Admin',
    role: 'admin',
  },
  {
    id: 'provider-1',
    email: 'proveedor@happyhub.es',
    password: '$2a$10$X5wH5mYqR5qI5HwPnT8fHuK5RqE5ZqF5qE5ZqF5qE5ZqF5qE5ZqF5q',
    name: 'Proveedor',
    role: 'provider',
  },
];

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

    const user = DEMO_USERS.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
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
      JWT_SECRET,
      { expiresIn: '7d' }
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
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
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

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = DEMO_USERS.find((u) => u.id === decoded.userId);

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
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
    });
  }
}
