// Create admin user for testing
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdminUser() {
  const client = await pool.connect();

  try {
    console.log('👤 Creating admin user...\n');

    const adminEmail = 'admin@happyhub.es';
    const adminPassword = 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Check if admin exists
    const existing = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existing.rows.length > 0) {
      console.log('ℹ️  Admin user already exists');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      return;
    }

    // Create admin user
    const result = await client.query(`
      INSERT INTO users (email, password_hash, name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role
    `, [adminEmail, passwordHash, 'Admin HappyHub', '+34624645517', 'admin']);

    const admin = result.rows[0];

    console.log('✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name: ${admin.name}`);
    console.log(`🛡️  Role: ${admin.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Login at: https://www.happyhub.es/login');
    console.log('   → After login, redirects to /admin/dashboard\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
