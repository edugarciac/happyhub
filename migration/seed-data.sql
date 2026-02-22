-- HappyHub Seed Data
-- Initial data for development and demo
-- Version: 1.0
-- Created: 2025-02-18

-- ============================================================================
-- DEMO USERS
-- ============================================================================
-- Passwords: All users use "happyhub123" (bcrypt hashed)
-- Hash: $2a$10$YourBcryptHashHere (replace with actual hash)

INSERT INTO users (email, password_hash, name, phone, role, created_at) VALUES
('admin@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Admin HappyHub', '+34666000001', 'admin', NOW()),
('cliente@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Cliente Demo', '+34666000002', 'client', NOW()),
('proveedor@happyhub.es', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Proveedor Demo', '+34666000003', 'provider', NOW()),
('maria.garcia@example.com', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'María García', '+34666111111', 'client', NOW()),
('juan.lopez@example.com', '$2a$10$K7L/MQGyhqG3XzBGKHOV9uC5fN8CfVRlkN7yWAJXJKdQJLO4J7PHC', 'Juan López', '+34666222222', 'client', NOW());

-- ============================================================================
-- EVENT TYPES
-- ============================================================================
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
('Otro', 'Otro tipo de evento. Contáctanos para eventos personalizados.', '🎉');

-- ============================================================================
-- PROVIDERS
-- ============================================================================
INSERT INTO providers (name, service_type, email, phone, description, price_range, active) VALUES
-- Catering
('Catering Gourmet Barcelona', 'catering', 'info@cateringgourmet.es', '+34666333301', 'Servicio de catering premium con menús personalizados. Cocina mediterránea, internacional y temática. Incluye montaje, servicio y recogida.', '500-2000€', TRUE),
('Sabores de la Abuela', 'catering', 'contacto@saboresabuela.es', '+34666333302', 'Catering tradicional casero. Perfecto para eventos familiares. Comida como en casa con toque profesional.', '300-1200€', TRUE),
('Vegan Delights Catering', 'catering', 'hola@vegandelights.es', '+34666333303', 'Catering 100% vegano y sostenible. Opciones creativas y deliciosas para todo tipo de eventos.', '400-1500€', TRUE),

-- Animación
('DJ Fiesta Pro', 'animacion', 'dj@fiestapto.es', '+34666444401', 'DJ profesional con más de 10 años de experiencia. Todo tipo de música, equipo de sonido profesional e iluminación LED.', '200-600€', TRUE),
('Animaciones Infantiles Mágicas', 'animacion', 'info@animacionesmagicas.es', '+34666444402', 'Animación para fiestas infantiles: payasos, magos, pintacaras, globoflexia, juegos y más. ¡Diversión garantizada!', '150-400€', TRUE),
('Show de Magia y Humor', 'animacion', 'contacto@showmagia.es', '+34666444403', 'Espectáculo de magia profesional para todas las edades. Ilusionismo, humor y participación del público.', '250-550€', TRUE),

-- Decoración
('Globos Mágicos', 'decoracion', 'info@globosmagicos.es', '+34666555501', 'Especialistas en decoración con globos: arcos, columnas, centros de mesa, photocall de globos. Diseños personalizados.', '150-800€', TRUE),
('Flores y Eventos', 'decoracion', 'flores@eventosbarcelona.es', '+34666555502', 'Decoración floral para todo tipo de eventos. Centros de mesa, ramos, arreglos florales. Flores frescas de temporada.', '200-1000€', TRUE),
('Decoración Temática Total', 'decoracion', 'tematica@decoraciontotal.es', '+34666555503', 'Decoración temática completa: superhéroes, princesas, vintage, tropical, etc. Incluye mobiliario, textiles y accesorios.', '300-1500€', TRUE),

-- Fotografía
('Fotógrafos de Eventos BCN', 'fotografia', 'info@fotografoseventos.es', '+34666666601', 'Fotografía profesional de eventos. Cobertura completa, sesión de 4 horas, entrega de fotos editadas en alta resolución.', '350-800€', TRUE),
('Photobooth Fun', 'fotografia', 'fun@photobooth.es', '+34666666602', 'Alquiler de photobooth con props divertidos. Impresión ilimitada de fotos, álbum de firmas incluido. ¡Diversión asegurada!', '200-450€', TRUE),

-- Video
('VideoEventos Pro', 'video', 'info@videoeventospro.es', '+34666777701', 'Vídeo profesional de tu evento. Edición cinematográfica, drones, cámara lenta. Entrega en formato digital y Blu-ray.', '500-1200€', TRUE),

-- Pastelería
('Dulces Momentos', 'pasteleria', 'pedidos@dulcesmomentos.es', '+34666888801', 'Tartas personalizadas para eventos. Diseños únicos, sabores variados. También cupcakes, galletas decoradas y candy bar.', '80-400€', TRUE),
('Repostería Artesanal', 'pasteleria', 'info@reposteriaartesanal.es', '+34666888802', 'Repostería artesanal de alta calidad. Tartas fondant, naked cakes, macarons. Sin gluten y veganas disponibles.', '100-500€', TRUE);

-- ============================================================================
-- DEMO RESERVATIONS
-- ============================================================================
-- Insertar algunas reservaciones de ejemplo (próximas fechas)

INSERT INTO reservations (user_id, event_date, time_slot, event_type, guests, total_price, deposit_paid, deposit_amount, status, notes, created_at) VALUES
-- Reserva confirmada próxima
(4, CURRENT_DATE + INTERVAL '15 days', 'afternoon', 'Cumpleaños', 25, 185.00, TRUE, 55.50, 'confirmed', 'Cumpleaños de niño de 8 años. Decoración temática de superhéroes.', NOW() - INTERVAL '5 days'),

-- Reserva pendiente
(5, CURRENT_DATE + INTERVAL '30 days', 'morning', 'Comunión', 40, 145.00, FALSE, NULL, 'pending', 'Primera comunión. Necesitan catering para 40 personas.', NOW() - INTERVAL '2 days'),

-- Reserva confirmada fin de semana
(4, CURRENT_DATE + INTERVAL '21 days', 'afternoon', 'Bautizo', 30, 185.00, TRUE, 55.50, 'confirmed', 'Bautizo el sábado. Cliente solicita decoración floral.', NOW() - INTERVAL '7 days');

-- ============================================================================
-- DEMO SERVICES (asociados a reservas)
-- ============================================================================
INSERT INTO services (reservation_id, provider_id, service_name, service_type, price, status, notes) VALUES
-- Servicios para la primera reserva (cumpleaños)
(1, 1, 'Menú infantil + adultos', 'catering', 800.00, 'confirmed', 'Menú mixto: 15 niños (hamburguesas y nuggets) + 10 adultos (paella)'),
(1, 4, 'DJ + animación infantil', 'animacion', 350.00, 'confirmed', 'DJ para música de fondo + 2 horas de animación infantil'),
(1, 7, 'Decoración temática superhéroes', 'decoracion', 400.00, 'confirmed', 'Globos, photocall y centros de mesa temática Marvel'),

-- Servicios para la tercera reserva (bautizo)
(3, 2, 'Catering tradicional', 'catering', 900.00, 'confirmed', 'Menú tradicional casero para 30 personas'),
(3, 8, 'Centros florales', 'decoracion', 250.00, 'requested', 'Centros de mesa con flores blancas y rosas');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show summary of seeded data
DO $$
DECLARE
    user_count INTEGER;
    event_type_count INTEGER;
    provider_count INTEGER;
    reservation_count INTEGER;
    service_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO event_type_count FROM event_types;
    SELECT COUNT(*) INTO provider_count FROM providers;
    SELECT COUNT(*) INTO reservation_count FROM reservations;
    SELECT COUNT(*) INTO service_count FROM services;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Seed Data Summary:';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Users created: %', user_count;
    RAISE NOTICE '  - 1 admin (admin@happyhub.es)';
    RAISE NOTICE '  - 3 clients (cliente@happyhub.es + 2 more)';
    RAISE NOTICE '  - 1 provider (proveedor@happyhub.es)';
    RAISE NOTICE '';
    RAISE NOTICE 'Event types created: %', event_type_count;
    RAISE NOTICE '  - Cumpleaños, Comunión, Bautizo, Boda, etc.';
    RAISE NOTICE '';
    RAISE NOTICE 'Providers created: %', provider_count;
    RAISE NOTICE '  - Catering (3), Animación (3), Decoración (3)';
    RAISE NOTICE '  - Fotografía (2), Video (1), Pastelería (2)';
    RAISE NOTICE '';
    RAISE NOTICE 'Demo reservations created: %', reservation_count;
    RAISE NOTICE '  - Next 15 days: 1 confirmed';
    RAISE NOTICE '  - Next 30 days: 1 pending, 1 confirmed';
    RAISE NOTICE '';
    RAISE NOTICE 'Demo services created: %', service_count;
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Default password for all users: happyhub123';
    RAISE NOTICE '============================================================';
END $$;

-- Show upcoming reservations
SELECT 'Upcoming Reservations:' as info;
SELECT
    r.id,
    r.event_date,
    r.time_slot,
    r.event_type,
    u.name as client,
    r.status,
    r.total_price
FROM reservations r
JOIN users u ON r.user_id = u.id
ORDER BY r.event_date;

-- Show providers by type
SELECT 'Providers by Type:' as info;
SELECT
    service_type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as providers
FROM providers
GROUP BY service_type
ORDER BY count DESC;
