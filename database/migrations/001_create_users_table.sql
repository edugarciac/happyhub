-- Migration: Create users table for authentication
-- Date: 2026-03-01
-- Description: Creates users table with email/password auth and inserts default admin/provider accounts

-- UP MIGRATION

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default users (password: happyhub123)
-- Hash generated with bcryptjs: bcrypt.hashSync('happyhub123', 10)
INSERT INTO users (email, password_hash, name, phone, role) VALUES
('admin@happyhub.es',      '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Admin HappyHub',  '+34666000001', 'admin'),
('proveedor@happyhub.es',  '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Proveedor Demo',  '+34666000003', 'provider'),
('cliente@happyhub.es',    '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Cliente Demo',    '+34666000002', 'client')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'Users of the platform (clients, providers, admins)';
COMMENT ON COLUMN users.role IS 'User role: client, provider, or admin';

-- DOWN MIGRATION (for rollback)
-- Uncomment below to rollback:
-- DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- DROP INDEX IF EXISTS idx_users_role;
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP TABLE IF EXISTS users;
