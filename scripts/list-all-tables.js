// List all tables in production database
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function listTables() {
  const client = await pool.connect();

  try {
    console.log('📊 Database Tables in Production:\n');

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    for (const table of tables.rows) {
      console.log(`\n📋 Table: ${table.table_name}`);

      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);

      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });

      const count = await client.query(`SELECT COUNT(*) as total FROM ${table.table_name}`);
      console.log(`   📈 Records: ${count.rows[0].total}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listTables();
