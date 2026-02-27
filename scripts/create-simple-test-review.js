// Create simple test review directly in production
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createSimpleTestReview() {
  const client = await pool.connect();

  try {
    console.log('📝 Creating direct test review in production...\n');

    // Create test review directly (bypassing reservation requirement for testing)
    // Note: reservation_id = 999999 (fake ID for testing purposes)
    const review = await client.query(`
      INSERT INTO reviews (
        reservation_id, rating, review_text, customer_name, is_published
      )
      VALUES (999999, 5, $1, $2, true)
      ON CONFLICT (reservation_id) DO UPDATE
      SET rating = 5,
          review_text = $1,
          customer_name = $2,
          is_published = true,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, rating, review_text, customer_name, is_published, created_at
    `, [
      '¡Experiencia increíble! El espacio es perfecto para celebraciones, todo impecable y el trato excelente. Sin duda volveremos para el próximo evento. 100% recomendado.',
      'María García'
    ]);

    const testReview = review.rows[0];

    console.log('✅ Test review created!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Review ID: ${testReview.id}`);
    console.log(`⭐ Rating: ${testReview.rating}/5 stars`);
    console.log(`👤 Customer: ${testReview.customer_name}`);
    console.log(`✅ Published: Yes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💬 "${testReview.review_text}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Fetch stats
    const stats = await client.query(`
      SELECT
        ROUND(AVG(rating), 1) as average,
        COUNT(*) as count
      FROM reviews
      WHERE is_published = true
    `);

    const { average, count } = stats.rows[0];
    console.log('📊 Current Stats:');
    console.log(`   ⭐ Average: ${average}/5`);
    console.log(`   📈 Total: ${count} review(s)`);
    console.log('\n🌐 Visit https://www.happyhub.es to see it live!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSimpleTestReview().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
