// Read-only report: lists activity_templates tags (old event_types TEXT[])
// that didn't find a matching row in event_types during migration 018's
// backfill, so an admin can review/re-tag them manually via the
// Catálogo de actividades admin page.
//
// Usage: node scripts/report-unmatched-activity-event-types.js
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT t.id, t.title, tag.name AS unmatched_tag
      FROM activity_templates t
      CROSS JOIN LATERAL unnest(t.event_types) AS tag(name)
      WHERE NOT EXISTS (
        SELECT 1 FROM event_types et WHERE et.name ILIKE tag.name
      )
      ORDER BY t.id
    `);

    if (rows.length === 0) {
      console.log('No unmatched tags — every activity_templates.event_types entry matched a real event_types row.');
      return;
    }

    console.log(`${rows.length} unmatched tag(s) found:`);
    for (const row of rows) {
      console.log(`  activity_templates.id=${row.id} ("${row.title}") — tag "${row.unmatched_tag}" has no matching event_types.name`);
    }
    console.log('\nReview these in /admin/actividades-catalogo and re-tag with a real event type.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Report failed:', err);
  process.exit(1);
});
