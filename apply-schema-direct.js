#!/usr/bin/env node
// Script directo para aplicar schema a Aurora
// Ejecutar UNA VEZ desde tu Mac

const { Client } = require('pg');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'happyhub',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function apply() {
  try {
    console.log('🔌 Conectando a Aurora...');
    await client.connect();
    console.log('✅ Conectado');

    // Check if tables exist
    const check = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (parseInt(check.rows[0].count) > 0) {
      console.log('✅ Schema ya existe. No se requiere acción.');
      await client.end();
      return;
    }

    console.log('📝 Aplicando schema-simple.sql...');
    const schema = fs.readFileSync('migration/schema-simple.sql', 'utf8');
    await client.query(schema);
    console.log('✅ Schema aplicado');

    console.log('🌱 Aplicando seed-data.sql...');
    const seed = fs.readFileSync('migration/seed-data.sql', 'utf8');
    await client.query(seed);
    console.log('✅ Seed data aplicado');

    // Verify
    const users = await client.query('SELECT COUNT(*) FROM users');
    const events = await client.query('SELECT COUNT(*) FROM event_types');
    const providers = await client.query('SELECT COUNT(*) FROM providers');

    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('           🎉 MIGRACIÓN COMPLETADA 100%');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`✅ Users: ${users.rows[0].count}`);
    console.log(`✅ Event Types: ${events.rows[0].count}`);
    console.log(`✅ Providers: ${providers.rows[0].count}`);
    console.log('');
    console.log('🌐 Tu app: https://main.du3to83rdme3o.amplifyapp.com');
    console.log('');

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('');
    console.error('Si ves ECONNRESET o timeout:');
    console.error('  Aurora está en red privada y no accesible desde tu Mac');
    console.error('  Necesitas aplicar schema desde AWS (Amplify tiene acceso VPC)');
    console.error('');
    console.error('Alternativa: Esperar unos minutos, Aurora puede estar inicializando');
    process.exit(1);
  }
}

apply();
