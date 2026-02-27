// Run database migration for reviews table
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({ connectionString });

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('📝 Running reviews table migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/003_create_reviews_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Extract only the UP migration part (remove comments about DOWN migration)
    const upMigration = sql.split('-- DOWN MIGRATION')[0];

    // Execute migration
    await client.query(upMigration);

    console.log('✅ Migration completed successfully!');
    console.log('   - reviews table created');
    console.log('   - indexes added');
    console.log('   - trigger configured');

    // Verify table exists
    const checkTable = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'reviews'
    `);

    if (checkTable.rows.length > 0) {
      console.log('✅ Verification: reviews table exists');
    } else {
      console.log('⚠️  Warning: Could not verify table creation');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.code === '42P07') {
      console.log('ℹ️  Table already exists - skipping migration');
    } else {
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
