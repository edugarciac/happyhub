// Verify reviews table exists in production
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verifyTable() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking reviews table...\n');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'reviews'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ reviews table does NOT exist');
      return;
    }

    console.log('✅ reviews table exists\n');

    // Get column structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'reviews'
      ORDER BY ordinal_position
    `);

    console.log('📋 Table structure:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Count reviews
    const count = await client.query('SELECT COUNT(*) as total FROM reviews');
    console.log(`\n📊 Total reviews in table: ${count.rows[0].total}`);

    // Show sample data
    const sample = await client.query('SELECT * FROM reviews LIMIT 3');
    if (sample.rows.length > 0) {
      console.log('\n📄 Sample reviews:');
      sample.rows.forEach(r => {
        console.log(`   #${r.id}: ${r.rating}⭐ by ${r.customer_name} (published: ${r.is_published})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTable();
