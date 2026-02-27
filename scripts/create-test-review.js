// Create test review in production database
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({ connectionString });

async function createTestReview() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking for eligible reservations...');

    // Check for confirmed reservations with past event dates
    const eligibleReservations = await client.query(`
      SELECT id, name, email, event_date, status
      FROM reservations
      WHERE status = 'confirmed' AND event_date < CURRENT_DATE
      ORDER BY event_date DESC
      LIMIT 5
    `);

    let reservationId;
    let customerName;

    if (eligibleReservations.rows.length > 0) {
      console.log(`✓ Found ${eligibleReservations.rows.length} eligible reservations`);
      const reservation = eligibleReservations.rows[0];
      reservationId = reservation.id;
      customerName = reservation.name;
      console.log(`  Using reservation #${reservationId} (${customerName}, ${reservation.event_date})`);
    } else {
      console.log('⚠️  No eligible reservations found. Creating test reservation...');

      // Create a test reservation with past date
      const newReservation = await client.query(`
        INSERT INTO reservations (
          name, email, phone, event_type, event_date, time_slot,
          guests, base_price, payment_method, status
        )
        VALUES (
          'María García', 'maria.garcia@example.com', '612345678',
          'cumpleaños', CURRENT_DATE - INTERVAL '7 days', 'afternoon',
          25, 185.00, 'card', 'confirmed'
        )
        RETURNING id, name
      `);

      reservationId = newReservation.rows[0].id;
      customerName = newReservation.rows[0].name;
      console.log(`  ✓ Created test reservation #${reservationId}`);
    }

    // Check if review already exists for this reservation
    const existingReview = await client.query(
      'SELECT id FROM reviews WHERE reservation_id = $1',
      [reservationId]
    );

    if (existingReview.rows.length > 0) {
      console.log(`⚠️  Review already exists for reservation #${reservationId}`);
      console.log('   Deleting and recreating...');
      await client.query('DELETE FROM reviews WHERE reservation_id = $1', [reservationId]);
    }

    // Create test review
    console.log('\n📝 Creating test review...');
    const review = await client.query(`
      INSERT INTO reviews (
        reservation_id, rating, review_text, customer_name, is_published
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, reservation_id, rating, review_text, customer_name, is_published, created_at
    `, [
      reservationId,
      5,
      '¡Experiencia increíble! El espacio es perfecto para celebraciones, todo impecable y el trato excelente. Sin duda volveremos para el próximo evento. 100% recomendado.',
      customerName,
      true // Auto-approve for testing
    ]);

    const testReview = review.rows[0];

    console.log('\n✅ Test review created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Review ID: ${testReview.id}`);
    console.log(`🎫 Reservation ID: ${testReview.reservation_id}`);
    console.log(`⭐ Rating: ${testReview.rating}/5 stars`);
    console.log(`👤 Customer: ${testReview.customer_name}`);
    console.log(`✅ Published: ${testReview.is_published ? 'Yes' : 'No'}`);
    console.log(`📅 Created: ${testReview.created_at}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💬 Review: "${testReview.review_text}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Fetch current stats
    console.log('\n📊 Fetching review statistics...');
    const stats = await client.query(`
      SELECT
        ROUND(AVG(rating), 1) as average,
        COUNT(*) as count
      FROM reviews
      WHERE is_published = true
    `);

    const { average, count } = stats.rows[0];
    console.log(`⭐ Average Rating: ${average || 'N/A'}`);
    console.log(`📈 Total Reviews: ${count}`);
    console.log('\n🌐 Visit your homepage to see the rating displayed!');

  } catch (error) {
    console.error('❌ Error creating test review:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTestReview().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
