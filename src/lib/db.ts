// PostgreSQL Database Connection Pool
// Uses environment variables from .env.local

import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { QueryResult, QueryResultRow } from 'pg';
import ws from 'ws';

// Configure Neon to use ws for WebSocket connections in Node.js
neonConfig.webSocketConstructor = ws;

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

// Ensure the users table exists (idempotent, safe to call on every cold start)
let usersTableReady = false;

export async function ensureUsersTable(): Promise<void> {
  if (usersTableReady) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

      -- Add email_verified column if missing (for existing databases)
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
    `);

    // Seed default accounts if the table was just created
    await client.query(`
      INSERT INTO users (email, password_hash, name, phone, role, email_verified) VALUES
      ('admin@happyhub.es',     '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Admin HappyHub', '+34666000001', 'admin', true),
      ('proveedor@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Proveedor Demo', '+34666000003', 'provider', true),
      ('cliente@happyhub.es',   '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Cliente Demo',   '+34666000002', 'client', true)
      ON CONFLICT (email) DO NOTHING;
    `);

    usersTableReady = true;
    console.log('✅ users table ready');
  } catch (error) {
    console.error('Error ensuring users table:', error);
    throw error;
  } finally {
    client.release();
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
        email_verified BOOLEAN DEFAULT false,
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

      -- Reservations table (matches database/schema.sql and OpenSpec B2)
      CREATE TABLE reservations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_date DATE NOT NULL,
        time_slot VARCHAR(20) NOT NULL,
        guests INT NOT NULL,
        extras JSONB DEFAULT '[]',
        base_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2),
        deposit_amount DECIMAL(10,2),
        security_deposit DECIMAL(10,2) DEFAULT 200,
        payment_method VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        customer_message TEXT,
        google_calendar_event_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_date, time_slot)
      );

      -- Partners table
      CREATE TABLE partners (
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
        partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
        service_name VARCHAR(255),
        service_type VARCHAR(100),
        price DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'requested',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Email verification tokens
      CREATE TABLE email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_reservations_date ON reservations(event_date);
      CREATE INDEX idx_reservations_email ON reservations(email);
      CREATE INDEX idx_partners_service_type ON partners(service_type);
      CREATE INDEX idx_services_reservation ON services(reservation_id);
      CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
    `);

    console.log('✅ Schema created');

    // Insert seed data
    console.log('🌱 Inserting seed data...');

    await client.query(`
      -- Demo users (password: happyhub123)
      INSERT INTO users (email, password_hash, name, phone, role, email_verified) VALUES
      ('admin@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Admin HappyHub', '+34666000001', 'admin', true),
      ('cliente@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Cliente Demo', '+34666000002', 'client', true),
      ('proveedor@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Proveedor Demo', '+34666000003', 'provider', true);

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
      INSERT INTO partners (name, service_type, email, phone, description, price_range) VALUES
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

// Idempotent migration for payment tracking columns
export async function runPaymentsMigration(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      -- deposit_amount
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);

      -- Change deposit_paid from boolean to decimal amount
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reservations' AND column_name='deposit_paid'
          AND data_type='boolean'
        ) THEN
          ALTER TABLE reservations RENAME COLUMN deposit_paid TO deposit_paid_bool;
          ALTER TABLE reservations ADD COLUMN deposit_paid DECIMAL(10,2) DEFAULT 0;
          UPDATE reservations SET deposit_paid = CASE WHEN deposit_paid_bool THEN deposit_amount ELSE 0 END;
          ALTER TABLE reservations DROP COLUMN deposit_paid_bool;
        END IF;
      END
      $$;

      -- Add deposit_paid as decimal if it doesn't exist yet
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS deposit_paid DECIMAL(10,2) DEFAULT 0;

      -- payment_status: 'pending' | 'pending_deposit' | 'deposit_paid' | 'fully_paid'
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending';

      -- Stripe session IDs for idempotency
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS stripe_deposit_session_id VARCHAR(255);
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS stripe_remaining_session_id VARCHAR(255);

      -- google_calendar_event_id already exists but ensure it
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);

      -- Backfill payment_status from existing data
      UPDATE reservations
      SET payment_status = CASE
        WHEN status = 'cancelled' THEN 'pending'
        WHEN deposit_paid >= total_price AND total_price > 0 THEN 'fully_paid'
        WHEN deposit_paid > 0 THEN 'deposit_paid'
        ELSE 'pending'
      END
      WHERE payment_status = 'pending';

      -- payment_tokens table
      CREATE TABLE IF NOT EXISTS payment_tokens (
        id             SERIAL PRIMARY KEY,
        token          VARCHAR(64) UNIQUE NOT NULL,
        reservation_id VARCHAR(100) NOT NULL,
        token_type     VARCHAR(30) NOT NULL DEFAULT 'remaining_payment',
        expires_at     TIMESTAMP NOT NULL,
        used           BOOLEAN DEFAULT false,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_payment_tokens_reservation ON payment_tokens(reservation_id);
    `);
    console.log('✅ Payments migration complete');
  } catch (error) {
    console.error('Error running payments migration:', error);
    throw error;
  } finally {
    client.release();
  }
}
