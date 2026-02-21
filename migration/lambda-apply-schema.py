"""
Lambda function to apply database schema to Aurora PostgreSQL
One-time use: invoke once, then delete
"""
import json
import psycopg2

SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
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

CREATE TABLE IF NOT EXISTS providers (
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

CREATE TABLE IF NOT EXISTS services (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_service_type ON providers(service_type);
CREATE INDEX IF NOT EXISTS idx_services_reservation ON services(reservation_id);
"""

SEED_SQL = """
INSERT INTO users (email, password_hash, name, phone, role, created_at) VALUES
('admin@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Admin HappyHub', '+34666000001', 'admin', NOW()),
('cliente@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Cliente Demo', '+34666000002', 'client', NOW()),
('proveedor@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Proveedor Demo', '+34666000003', 'provider', NOW()),
('maria.garcia@example.com', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'María García', '+34666111111', 'client', NOW()),
('juan.lopez@example.com', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Juan López', '+34666222222', 'client', NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO event_types (name, description, icon) VALUES
('Cumpleaños', 'Fiesta de cumpleaños para niños y adultos. Espacio ideal para celebraciones con amigos y familia.', '🎂'),
('Comunión', 'Primera comunión. Ambiente perfecto para este día tan especial.', '🕊️'),
('Bautizo', 'Celebración de bautizo. Espacio acogedor para familia e invitados.', '👶'),
('Boda', 'Enlace matrimonial. Celebra tu día especial en nuestro venue.', '💍'),
('Reunión Familiar', 'Reunión de familia o amigos. Espacio confortable para compartir momentos.', '👨‍👩‍👧‍👦'),
('Evento Corporativo', 'Evento de empresa o team building. Perfecto para eventos profesionales.', '💼'),
('Baby Shower', 'Celebración de baby shower. Espacio cálido para recibir al bebé.', '🍼'),
('Despedida de Soltero/a', 'Despedida de soltero o soltera. ¡Celebra antes de la boda!', '🎊'),
('Graduación', 'Celebración de graduación. Comparte tu logro con tus seres queridos.', '🎓'),
('Aniversario', 'Aniversario de pareja. Renueva vuestros votos o simplemente celebrad.', '💝'),
('Otro', 'Otro tipo de evento. Contáctanos para eventos personalizados.', '🎉')
ON CONFLICT (name) DO NOTHING;

INSERT INTO providers (name, service_type, email, phone, description, price_range, active) VALUES
('Catering Gourmet Barcelona', 'catering', 'info@cateringgourmet.es', '+34666333301', 'Servicio de catering premium con menús personalizados.', '500-2000€', TRUE),
('Sabores de la Abuela', 'catering', 'contacto@saboresabuela.es', '+34666333302', 'Catering tradicional casero.', '300-1200€', TRUE),
('Vegan Delights Catering', 'catering', 'hola@vegandelights.es', '+34666333303', 'Catering 100% vegano y sostenible.', '400-1500€', TRUE),
('DJ Fiesta Pro', 'animacion', 'dj@fiestapto.es', '+34666444401', 'DJ profesional con equipo de sonido e iluminación LED.', '200-600€', TRUE),
('Animaciones Infantiles Mágicas', 'animacion', 'info@animacionesmagicas.es', '+34666444402', 'Animación infantil: payasos, magos, pintacaras.', '150-400€', TRUE),
('Show de Magia y Humor', 'animacion', 'contacto@showmagia.es', '+34666444403', 'Espectáculo de magia profesional.', '250-550€', TRUE),
('Globos Mágicos', 'decoracion', 'info@globosmagicos.es', '+34666555501', 'Decoración con globos personalizada.', '150-800€', TRUE),
('Flores y Eventos', 'decoracion', 'flores@eventosbarcelona.es', '+34666555502', 'Decoración floral para eventos.', '200-1000€', TRUE),
('Decoración Temática Total', 'decoracion', 'tematica@decoraciontotal.es', '+34666555503', 'Decoración temática completa.', '300-1500€', TRUE),
('Fotógrafos de Eventos BCN', 'fotografia', 'info@fotografoseventos.es', '+34666666601', 'Fotografía profesional de eventos.', '350-800€', TRUE),
('Photobooth Fun', 'fotografia', 'fun@photobooth.es', '+34666666602', 'Alquiler de photobooth.', '200-450€', TRUE),
('VideoEventos Pro', 'video', 'info@videoeventospro.es', '+34666777701', 'Vídeo profesional de eventos.', '500-1200€', TRUE),
('Dulces Momentos', 'pasteleria', 'pedidos@dulcesmomentos.es', '+34666888801', 'Tartas personalizadas.', '80-400€', TRUE),
('Repostería Artesanal', 'pasteleria', 'info@reposteriaartesanal.es', '+34666888802', 'Repostería artesanal de alta calidad.', '100-500€', TRUE)
ON CONFLICT DO NOTHING;
"""

def lambda_handler(event, context):
    conn = None
    try:
        # Connect to Aurora
        conn = psycopg2.connect(
            host='happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com',
            port=5432,
            database='happyhub',
            user='dbadmin',
            password='c0MAkvDuZ6yWhfUUzgMh',
            connect_timeout=10
        )

        cur = conn.cursor()

        # Check if tables exist
        cur.execute("""
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'users'
        """)
        exists = cur.fetchone()[0] > 0

        if exists:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Schema already exists. No action needed.',
                    'status': 'already_initialized'
                })
            }

        # Apply schema
        cur.execute(SCHEMA_SQL)
        conn.commit()

        # Apply seed data
        cur.execute(SEED_SQL)
        conn.commit()

        # Verify
        cur.execute("SELECT COUNT(*) FROM users")
        users_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM event_types")
        event_types_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM providers")
        providers_count = cur.fetchone()[0]

        cur.close()

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Database schema applied successfully!',
                'status': 'success',
                'counts': {
                    'users': users_count,
                    'event_types': event_types_count,
                    'providers': providers_count
                }
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error applying schema',
                'error': str(e)
            })
        }
    finally:
        if conn:
            conn.close()
