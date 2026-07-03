// API Route para setup inicial de base de datos
// Usage: Visitar http://localhost:3000/api/setup-database
// IMPORTANTE: Eliminar después de usar (solo para migración)

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from '@/utils/adminAuth';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false // Sin SSL para conexión interna VPC
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await requireAdminSession(req, res);
  } catch {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const client = await pool.connect();

    const logs: string[] = [];

    logs.push('🔌 Conexión a base de datos exitosa');

    // Check if tables already exist
    const checkTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      LIMIT 1
    `);

    if (checkTables.rows.length > 0) {
      logs.push('⚠️  Las tablas ya existen. Saltando creación de schema.');
      client.release();

      return res.status(200).json({
        success: true,
        message: 'Database already initialized',
        logs
      });
    }

    // Apply schema.sql
    logs.push('📝 Aplicando schema.sql...');
    const schemaPath = path.join(process.cwd(), 'migration', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSQL);
    logs.push('✅ Schema aplicado correctamente');

    // Verify tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    logs.push(`✅ Tablas creadas: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);

    // Apply seed-data.sql
    logs.push('🌱 Aplicando seed-data.sql...');
    const seedPath = path.join(process.cwd(), 'migration', 'seed-data.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    await client.query(seedSQL);
    logs.push('✅ Seed data aplicado correctamente');

    // Verify data
    const usersCount = await client.query('SELECT COUNT(*) as total FROM users');
    const eventTypesCount = await client.query('SELECT COUNT(*) as total FROM event_types');
    const partnersCount = await client.query('SELECT COUNT(*) as total FROM partners');

    logs.push(`✅ Usuarios insertados: ${usersCount.rows[0].total}`);
    logs.push(`✅ Tipos de evento: ${eventTypesCount.rows[0].total}`);
    logs.push(`✅ Partners: ${partnersCount.rows[0].total}`);

    client.release();

    res.status(200).json({
      success: true,
      message: 'Database setup completed successfully!',
      logs,
      summary: {
        users: parseInt(usersCount.rows[0].total),
        eventTypes: parseInt(eventTypesCount.rows[0].total),
        partners: parseInt(partnersCount.rows[0].total)
      }
    });

  } catch (error: any) {
    console.error('Setup error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Verifica que las variables de entorno DB_* estén configuradas correctamente en .env.local'
    });
  }
}
