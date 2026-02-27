// Create complete test data: user, reservation, and review
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createFullTestData() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating complete test data in production...\n');

    // ============================================
    // Step 1: Create test user
    // ============================================
    console.log('👤 Step 1: Creating test user...');

    const testEmail = 'maria.garcia.test@happyhub.es';
    const testPassword = await bcrypt.hash('test123', 10);

    const existingUser = await client.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [testEmail]
    );

    let userId;
    let userName;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      userName = existingUser.rows[0].name;
      console.log(`   ℹ️  User already exists (ID: ${userId})`);
    } else {
      const newUser = await client.query(`
        INSERT INTO users (email, password_hash, name, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, name
      `, [testEmail, testPassword, 'María García', '612345678', 'client']);

      userId = newUser.rows[0].id;
      userName = newUser.rows[0].name;
      console.log(`   ✅ User created (ID: ${userId})`);
    }

    console.log(`      Email: ${testEmail}`);
    console.log(`      Name: ${userName}`);

    // ============================================
    // Step 2: Create test reservation
    // ============================================
    console.log('\n📅 Step 2: Creating test reservation...');

    // Calculate a past date (7 days ago)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const formattedDate = pastDate.toISOString().split('T')[0];

    const existingReservation = await client.query(
      'SELECT id FROM reservations WHERE user_id = $1 AND status = $2 LIMIT 1',
      [userId, 'confirmed']
    );

    let reservationId;

    if (existingReservation.rows.length > 0) {
      reservationId = existingReservation.rows[0].id;
      console.log(`   ℹ️  Using existing reservation (ID: ${reservationId})`);
    } else {
      const newReservation = await client.query(`
        INSERT INTO reservations (
          user_id, event_date, time_slot, event_type, guests,
          total_price, deposit_paid, deposit_amount, status,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, event_date, time_slot, event_type
      `, [
        userId,
        formattedDate,
        'afternoon',
        'cumpleaños',
        25,
        185.00,
        true,
        55.50,
        'confirmed',
        'Reserva de prueba para sistema de reseñas'
      ]);

      reservationId = newReservation.rows[0].id;
      console.log(`   ✅ Reservation created (ID: ${reservationId})`);
      console.log(`      Date: ${newReservation.rows[0].event_date}`);
      console.log(`      Time: ${newReservation.rows[0].time_slot}`);
      console.log(`      Type: ${newReservation.rows[0].event_type}`);
      console.log(`      Status: confirmed`);
    }

    // ============================================
    // Step 3: Create test review
    // ============================================
    console.log('\n⭐ Step 3: Creating test review...');

    const existingReview = await client.query(
      'SELECT id FROM reviews WHERE reservation_id = $1',
      [reservationId]
    );

    let reviewId;

    if (existingReview.rows.length > 0) {
      reviewId = existingReview.rows[0].id;
      console.log(`   ℹ️  Review already exists (ID: ${reviewId})`);
      console.log('   🔄 Updating to 5 stars and publishing...');

      await client.query(`
        UPDATE reviews
        SET rating = 5,
            review_text = $1,
            customer_name = $2,
            is_published = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [
        '¡Experiencia increíble! El espacio es perfecto para celebraciones, todo impecable y el trato excelente. Sin duda volveremos para el próximo evento. 100% recomendado.',
        userName,
        reviewId
      ]);

      console.log('   ✅ Review updated');
    } else {
      const newReview = await client.query(`
        INSERT INTO reviews (
          reservation_id, rating, review_text, customer_name, is_published
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, rating, review_text, customer_name, is_published, created_at
      `, [
        reservationId,
        5,
        '¡Experiencia increíble! El espacio es perfecto para celebraciones, todo impecable y el trato excelente. Sin duda volveremos para el próximo evento. 100% recomendado.',
        userName,
        true // Auto-published for testing
      ]);

      reviewId = newReview.rows[0].id;
      console.log(`   ✅ Review created (ID: ${reviewId})`);
      console.log(`      Rating: ${newReview.rows[0].rating}/5 ⭐⭐⭐⭐⭐`);
      console.log(`      Published: Yes`);
    }

    // ============================================
    // Step 4: Display statistics
    // ============================================
    console.log('\n📊 Step 4: Fetching statistics...');

    const stats = await client.query(`
      SELECT
        ROUND(AVG(rating), 1) as average,
        COUNT(*) as count
      FROM reviews
      WHERE is_published = true
    `);

    const { average, count } = stats.rows[0];

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n👤 User: ${userName} (${testEmail})`);
    console.log(`   ID: ${userId}`);
    console.log(`   Password: test123`);
    console.log(`\n📅 Reservation: #${reservationId}`);
    console.log(`   Date: ${formattedDate} (7 days ago)`);
    console.log(`   Status: confirmed`);
    console.log(`\n⭐ Review: #${reviewId}`);
    console.log(`   Rating: 5/5 stars`);
    console.log(`   Published: Yes`);
    console.log(`\n📈 Current Stats:`);
    console.log(`   Average: ${average}/5`);
    console.log(`   Total Reviews: ${count}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Visit https://www.happyhub.es to see it live!');
    console.log('   The homepage should now show the rating badge.');
    console.log('\n💡 Test API endpoints:');
    console.log('   curl https://www.happyhub.es/api/reviews');
    console.log('   curl https://www.happyhub.es/api/reviews/stats');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error creating test data:', error.message);
    console.error('Details:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createFullTestData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
