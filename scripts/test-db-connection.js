// Test database connection and verify users exist
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');

    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');

    // Test query
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Database time:', result.rows[0].time);

    // Check users
    const users = await client.query('SELECT id, email, name, role FROM users ORDER BY id');
    console.log('\n👥 Users in database:');
    users.rows.forEach(user => {
      console.log(`  ${user.id}. ${user.email} (${user.name}) - Role: ${user.role}`);
    });

    console.log('\n✅ Database is ready!');
    console.log('\n🚀 You can now test the login at: http://localhost:3000/login');
    console.log('\nDemo credentials:');
    console.log('  Email: admin@happyhub.es');
    console.log('  Password: happyhub123');

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
}

testConnection();
