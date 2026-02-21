// PostgreSQL Database Connection Pool
// Uses environment variables from .env.local

import { Pool as NeonPool } from '@neondatabase/serverless';
import { QueryResult, QueryResultRow } from 'pg';

// Create connection pool using Neon serverless driver
const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new NeonPool({ connectionString });

// Export pool for direct use
export default pool;

// Helper function: Execute query with error handling
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function: Get single row
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

// Helper function: Check database connection
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as time, version() as version');
    console.log('Database connection OK:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database schema if not exists
export async function initializeSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    // Check if tables exist
    const tablesExist = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'users'
    `);

    if (parseInt(tablesExist.rows[0].count) > 0) {
      console.log('✅ Database schema already exists');
      return;
    }

    console.log('📝 Creating database schema...');

    // Apply schema (simplified version inline)
    await client.query(`
      -- Users table
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'client',
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

      -- Indexes
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_reservations_date ON reservations(event_date);
      CREATE INDEX idx_reservations_user ON reservations(user_id);
      CREATE INDEX idx_providers_service_type ON providers(service_type);
      CREATE INDEX idx_services_reservation ON services(reservation_id);
    `);

    console.log('✅ Schema created');

    // Insert seed data
    console.log('🌱 Inserting seed data...');

    await client.query(`
      -- Demo users (password: happyhub123)
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
      ('DJ Fiesta Pro', 'animacion', 'dj@fiestapto.es', '+34666444401', 'DJ profesional', '200-600€'),
      ('Globos Mágicos', 'decoracion', 'info@globosmagicos.es', '+34666555501', 'Decoración con globos', '150-800€');
    `);

    console.log('✅ Seed data inserted');

  } catch (error) {
    console.error('Error initializing schema:', error);
    throw error;
  } finally {
    client.release();
  }
}
