// Check production database schema
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking reservations table schema...\n');

    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'reservations'
      ORDER BY ordinal_position
    `);

    console.log('Columns in reservations table:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n📊 Sample reservation data:');
    const sample = await client.query('SELECT * FROM reservations LIMIT 1');
    if (sample.rows.length > 0) {
      console.log(JSON.stringify(sample.rows[0], null, 2));
    } else {
      console.log('  No reservations found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
