// Apply a 20% price increase to every row in pricing_rules
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function printPricingRules(client, label) {
  const rules = await client.query(
    'SELECT rule_name, day_type, time_slot, price FROM pricing_rules ORDER BY id'
  );
  console.log(`\n📋 ${label}:`);
  rules.rows.forEach((rule) => {
    console.log(`   ${rule.rule_name.padEnd(25)} ${rule.day_type.padEnd(10)} ${rule.time_slot.padEnd(12)} ${rule.price}€`);
  });
  return rules.rows;
}

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('📝 Applying 20% price increase to pricing_rules...');

    await printPricingRules(client, 'Prices before increase');

    const migrationPath = path.join(__dirname, '../database/migrations/015_increase_pricing_20_percent.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const upMigration = sql.split('-- DOWN MIGRATION')[0];

    await client.query(upMigration);

    console.log('\n✅ Migration completed!');

    await printPricingRules(client, 'Prices after increase');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
