// Run approval fields migration
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('📝 Running approval fields migration...');

    const migrationPath = path.join(__dirname, '../database/migrations/004_add_reservation_approval_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    const upMigration = sql.split('-- DOWN MIGRATION')[0];

    await client.query(upMigration);

    console.log('✅ Migration completed!');
    console.log('   - rejection_reason column added');
    console.log('   - admin_approved_by column added');
    console.log('   - approved_at column added');

    // Verify columns exist
    const check = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'reservations'
        AND column_name IN ('rejection_reason', 'admin_approved_by', 'approved_at')
    `);

    console.log(`\n✅ Verification: ${check.rows.length}/3 columns exist`);
    check.rows.forEach(row => console.log(`   - ${row.column_name}`));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42701') {
      console.log('ℹ️  Columns already exist - skipping');
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
