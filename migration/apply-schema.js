// Apply schema and seed data to Aurora PostgreSQL
// Usage: node migration/apply-schema.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Try without SSL first, then with SSL
  ssl: false
});

async function applySchema() {
  const client = await pool.connect();

  try {
    console.log('════════════════════════════════════════════════════');
    console.log('  Aplicando Schema SQL a Aurora PostgreSQL  ');
    console.log('════════════════════════════════════════════════════');
    console.log('');

    // Test connection
    console.log('1️⃣  Probando conexión...');
    const versionResult = await client.query('SELECT version()');
    console.log('✅ Conectado a:', versionResult.rows[0].version.substring(0, 50) + '...');
    console.log('');

    // Apply schema
    console.log('2️⃣  Aplicando schema (creando tablas)...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );
    await client.query(schemaSQL);
    console.log('✅ Schema aplicado correctamente');
    console.log('');

    // Verify tables
    console.log('3️⃣  Verificando tablas creadas...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');

    // Apply seed data
    console.log('4️⃣  Aplicando seed data (datos iniciales)...');
    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'seed-data.sql'),
      'utf8'
    );
    await client.query(seedSQL);
    console.log('✅ Seed data aplicado correctamente');
    console.log('');

    // Verify data
    console.log('5️⃣  Verificando datos insertados...');
    const usersCount = await client.query('SELECT COUNT(*) as total FROM users');
    const eventTypesCount = await client.query('SELECT COUNT(*) as total FROM event_types');
    const providersCount = await client.query('SELECT COUNT(*) as total FROM providers');
    const reservationsCount = await client.query('SELECT COUNT(*) as total FROM reservations');

    console.log(`Usuarios: ${usersCount.rows[0].total}`);
    console.log(`Tipos de evento: ${eventTypesCount.rows[0].total}`);
    console.log(`Proveedores: ${providersCount.rows[0].total}`);
    console.log(`Reservas: ${reservationsCount.rows[0].total}`);
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('           ✅ TODO COMPLETADO EXITOSAMENTE           ');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Próximos pasos:');
    console.log('  1. Actualizar n8n workflows (Fase 2)');
    console.log('  2. Actualizar Next.js app (Fase 3)');
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('');
    console.error('Si el error es de conexión, puede ser que:');
    console.error('  - La base de datos esté en subnet privada');
    console.error('  - Necesites conectar desde EC2 n8n como bastion');
    console.error('  - Security group no permita tu IP');
    console.error('');
    console.error('Solución alternativa:');
    console.error('  - Ejecutar desde EC2 n8n (tiene acceso a la VPC)');
    console.error('  - O configurar subnets públicas en AWS');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
applySchema().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
