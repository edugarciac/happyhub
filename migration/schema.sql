-- HappyHub PostgreSQL Schema
-- Database: happyhub
-- Version: 1.0
-- Created: 2025-02-18

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search (optional)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Users of the platform (clients, providers, admins)';
COMMENT ON COLUMN users.role IS 'User role: client, provider, or admin';

-- ============================================================================
-- EVENT TYPES TABLE
-- ============================================================================
CREATE TABLE event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE event_types IS 'Types of events (birthdays, communions, weddings, etc.)';

-- ============================================================================
-- RESERVATIONS TABLE
-- ============================================================================
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'night')),
    event_type VARCHAR(100),
    guests INTEGER,
    total_price DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    stripe_payment_intent_id VARCHAR(255),
    stripe_checkout_session_id VARCHAR(255),
    google_calendar_event_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE reservations IS 'Event reservations';
COMMENT ON COLUMN reservations.time_slot IS 'Time slot: morning (11:00-14:30), afternoon (16:30-20:30), night (22:00-02:00)';
COMMENT ON COLUMN reservations.status IS 'Reservation status: pending, confirmed, cancelled, completed';

-- ============================================================================
-- PROVIDERS TABLE
-- ============================================================================
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

COMMENT ON TABLE providers IS 'Service providers (catering, DJ, decoration, etc.)';
COMMENT ON COLUMN providers.service_type IS 'Type of service: catering, animacion, decoracion, fotografia, etc.';

-- ============================================================================
-- SERVICES TABLE
-- ============================================================================
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
    service_name VARCHAR(255),
    service_type VARCHAR(100),
    price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE services IS 'Additional services requested for reservations (catering, DJ, etc.)';
COMMENT ON COLUMN services.status IS 'Service status: requested, confirmed, cancelled, completed';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Reservations indexes
CREATE INDEX idx_reservations_date ON reservations(event_date);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_date_slot ON reservations(event_date, time_slot);
CREATE INDEX idx_reservations_stripe_payment ON reservations(stripe_payment_intent_id);
CREATE INDEX idx_reservations_google_calendar ON reservations(google_calendar_event_id);

-- Providers indexes
CREATE INDEX idx_providers_service_type ON providers(service_type);
CREATE INDEX idx_providers_active ON providers(active) WHERE active = TRUE;

-- Services indexes
CREATE INDEX idx_services_reservation ON services(reservation_id);
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_status ON services(status);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Ensure reservation date is not in the past
ALTER TABLE reservations ADD CONSTRAINT check_date_not_past
    CHECK (event_date >= CURRENT_DATE);

-- Ensure guests is positive
ALTER TABLE reservations ADD CONSTRAINT check_guests_positive
    CHECK (guests IS NULL OR guests > 0);

-- Ensure prices are positive
ALTER TABLE reservations ADD CONSTRAINT check_price_positive
    CHECK (total_price IS NULL OR total_price >= 0);

ALTER TABLE services ADD CONSTRAINT check_service_price_positive
    CHECK (price IS NULL OR price >= 0);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active reservations with user info
CREATE OR REPLACE VIEW active_reservations AS
SELECT
    r.id,
    r.event_date,
    r.time_slot,
    r.event_type,
    r.guests,
    r.total_price,
    r.status,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    r.created_at
FROM reservations r
LEFT JOIN users u ON r.user_id = u.id
WHERE r.status IN ('pending', 'confirmed')
ORDER BY r.event_date ASC;

COMMENT ON VIEW active_reservations IS 'View of active (pending/confirmed) reservations with user details';

-- View: Upcoming events (next 30 days)
CREATE OR REPLACE VIEW upcoming_events AS
SELECT
    r.id,
    r.event_date,
    r.time_slot,
    r.event_type,
    r.guests,
    u.name as user_name,
    u.email as user_email,
    r.status
FROM reservations r
LEFT JOIN users u ON r.user_id = u.id
WHERE r.event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND r.status IN ('confirmed')
ORDER BY r.event_date ASC, r.time_slot ASC;

COMMENT ON VIEW upcoming_events IS 'Confirmed events in the next 30 days';

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to get monthly revenue
CREATE OR REPLACE FUNCTION get_monthly_revenue(target_year INTEGER, target_month INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(total_price), 0)
        FROM reservations
        WHERE EXTRACT(YEAR FROM event_date) = target_year
          AND EXTRACT(MONTH FROM event_date) = target_month
          AND status IN ('confirmed', 'completed')
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_revenue IS 'Calculate total revenue for a specific month';

-- Function to check availability
CREATE OR REPLACE FUNCTION check_availability(check_date DATE, check_time_slot VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1
        FROM reservations
        WHERE event_date = check_date
          AND time_slot = check_time_slot
          AND status IN ('pending', 'confirmed')
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_availability IS 'Check if a date and time slot is available (returns TRUE if available)';

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed)
-- ============================================================================

-- Grant permissions to dbadmin (already owner, but explicit for clarity)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dbadmin;
GRANT USAGE ON SCHEMA public TO dbadmin;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'HappyHub Schema created successfully!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - users';
    RAISE NOTICE '  - event_types';
    RAISE NOTICE '  - reservations';
    RAISE NOTICE '  - providers';
    RAISE NOTICE '  - services';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - active_reservations';
    RAISE NOTICE '  - upcoming_events';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - get_monthly_revenue()';
    RAISE NOTICE '  - check_availability()';
    RAISE NOTICE '============================================================';
END $$;
