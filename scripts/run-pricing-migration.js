// Run pricing table migration
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
    console.log('📝 Running pricing table migration...\n');

    const migrationPath = path.join(__dirname, '../database/migrations/005_create_pricing_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const upMigration = sql.split('-- DOWN MIGRATION')[0];

    await client.query(upMigration);

    console.log('✅ Migration completed!\n');

    // Verify and show pricing rules
    const rules = await client.query('SELECT rule_name, day_type, time_slot, price FROM pricing_rules ORDER BY id');

    console.log('📋 Pricing rules created:');
    rules.rows.forEach(rule => {
      console.log(`   ${rule.rule_name.padEnd(25)} ${rule.day_type.padEnd(10)} ${rule.time_slot.padEnd(12)} ${rule.price}€`);
    });

    console.log('\n✅ Prices now in database!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.log('ℹ️  Table already exists - skipping');
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
