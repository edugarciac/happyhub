// Initialize HappyHub database schema
// Node.js version (no psql required)

require('dotenv').config();
const { Pool } = require('pg');

// Use full connection string for Neon
const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
});

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🗄️  Initializing HappyHub database...');
    console.log('📝 Creating database schema...');

    // Drop existing tables if they exist
    await client.query(`
      DROP TABLE IF EXISTS services CASCADE;
      DROP TABLE IF EXISTS providers CASCADE;
      DROP TABLE IF EXISTS reservations CASCADE;
      DROP TABLE IF EXISTS event_types CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables
    await client.query(`
      -- Users table
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Event types table
      CREATE TABLE event_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Reservations table
      CREATE TABLE reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        event_type VARCHAR(100),
        guests INTEGER,
        total_price DECIMAL(10,2),
        deposit_paid BOOLEAN DEFAULT FALSE,
        deposit_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        stripe_payment_intent_id VARCHAR(255),
        stripe_checkout_session_id VARCHAR(255),
        google_calendar_event_id VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Providers table
      CREATE TABLE providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        service_type VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        description TEXT,
        price_range VARCHAR(50),
        logo_url VARCHAR(500),
        website VARCHAR(500),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Services table
      CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
        provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
        service_name VARCHAR(255),
        service_type VARCHAR(100),
        price DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'requested',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for performance
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_reservations_date ON reservations(event_date);
      CREATE INDEX idx_reservations_user ON reservations(user_id);
      CREATE INDEX idx_providers_service_type ON providers(service_type);
      CREATE INDEX idx_services_reservation ON services(reservation_id);
    `);

    console.log('✅ Schema created successfully');
    console.log('🌱 Inserting seed data...');

    // Insert seed data
    await client.query(`
      -- Demo users (password: happyhub123 for all)
      INSERT INTO users (email, password_hash, name, phone, role) VALUES
      ('admin@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Admin HappyHub', '+34666000001', 'admin'),
      ('cliente@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Cliente Demo', '+34666000002', 'client'),
      ('proveedor@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Proveedor Demo', '+34666000003', 'provider');

      -- Event types
      INSERT INTO event_types (name, description, icon) VALUES
      ('Cumpleaños', 'Fiesta de cumpleaños', '🎂'),
      ('Comunión', 'Primera comunión', '🕊️'),
      ('Bautizo', 'Celebración de bautizo', '👶'),
      ('Boda', 'Enlace matrimonial', '💍'),
      ('Reunión Familiar', 'Reunión de familia o amigos', '👨‍👩‍👧‍👦'),
      ('Evento Corporativo', 'Evento de empresa', '💼'),
      ('Otro', 'Otro tipo de evento', '🎉');

      -- Providers
      INSERT INTO providers (name, service_type, email, phone, description, price_range) VALUES
      ('Catering Gourmet', 'catering', 'info@cateringgourmet.es', '+34666333301', 'Servicio de catering premium', '500-2000€'),
      ('DJ Fiesta Pro', 'animacion', 'dj@fiestapro.es', '+34666444401', 'DJ profesional', '200-600€'),
      ('Globos Mágicos', 'decoracion', 'info@globosmagicos.es', '+34666555501', 'Decoración con globos', '150-800€');
    `);

    console.log('✅ Seed data inserted successfully');
    console.log('');
    console.log('🎉 Database initialization complete!');
    console.log('');
    console.log('Demo users (password: happyhub123):');
    console.log('  - admin@happyhub.es (Admin)');
    console.log('  - cliente@happyhub.es (Client)');
    console.log('  - proveedor@happyhub.es (Provider)');
    console.log('');
    console.log('You can now start the development server: npm run dev');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
