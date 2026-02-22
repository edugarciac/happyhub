const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false  // Sin SSL para conexión interna VPC
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log('════════════════════════════════════════════════════');
    console.log('  Aplicando Schema a Aurora PostgreSQL');
    console.log('════════════════════════════════════════════════════');
    console.log('');

    console.log('🔌 Conectando a Aurora...');
    const version = await client.query('SELECT version()');
    console.log('✅ Conectado:', version.rows[0].version.substring(0, 60));
    console.log('');

    console.log('📝 Aplicando schema...');
    const schema = fs.readFileSync('migration/schema-simple.sql', 'utf8');
    await client.query(schema);
    console.log('✅ Schema aplicado (5 tablas + indexes)');
    console.log('');

    console.log('🌱 Aplicando seed data...');
    const seed = fs.readFileSync('migration/seed-data.sql', 'utf8');
    await client.query(seed);
    console.log('✅ Seed data aplicado');
    console.log('');

    console.log('🔍 Verificando...');
    const users = await client.query('SELECT COUNT(*) FROM users');
    const eventTypes = await client.query('SELECT COUNT(*) FROM event_types');
    const providers = await client.query('SELECT COUNT(*) FROM providers');
    const reservations = await client.query('SELECT COUNT(*) FROM reservations');

    console.log(`  Users: ${users.rows[0].count}`);
    console.log(`  Event Types: ${eventTypes.rows[0].count}`);
    console.log(`  Providers: ${providers.rows[0].count}`);
    console.log(`  Reservations: ${reservations.rows[0].count}`);
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('           ✅ FASE 1 COMPLETADA 100%');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Próximo paso: Fase 2 - Configurar n8n workflows');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('');
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ECONNRESET')) {
      console.error('Problema de conexión. Aurora está en subnet privada.');
      console.error('');
      console.error('Solución: Necesitas aplicar schema desde EC2 n8n (tiene acceso VPC)');
      console.error('Ver: migration/INSTRUCCIONES_QUERY_EDITOR.md');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
