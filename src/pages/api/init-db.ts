// API Route para inicializar base de datos
// Usage: GET http://localhost:3000/api/init-db
// IMPORTANTE: Solo ejecutar UNA VEZ, luego puedes eliminar este archivo

import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeSchema, checkConnection } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Permitir con secret token en producción
  const initSecret = req.query.secret || req.headers['x-init-secret'];
  const expectedSecret = process.env.DB_PASSWORD; // Usar DB password como secret

  if (process.env.NODE_ENV === 'production' && initSecret !== expectedSecret) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized. Provide valid secret token.'
    });
  }

  try {
    console.log('🔌 Checking database connection...');

    // Test connection
    const connected = await checkConnection();
    if (!connected) {
      return res.status(500).json({
        success: false,
        error: 'Could not connect to database'
      });
    }

    console.log('✅ Connection OK');
    console.log('📝 Initializing schema...');

    // Initialize schema (checks if already exists)
    await initializeSchema();

    console.log('✅ Schema initialized');

    res.status(200).json({
      success: true,
      message: 'Database initialized successfully!',
      info: {
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Init DB error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check logs for details. Verify DATABASE_URL in .env.local'
    });
  }
}
