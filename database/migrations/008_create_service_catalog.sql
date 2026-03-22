-- Migration: Create service_catalog table for public services page
-- The existing "services" table is for reservation-specific services (linked to reservations).
-- This new table is the catalog of services offered, displayed on the public /servicios page.

CREATE TABLE IF NOT EXISTS service_catalog (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  price DECIMAL(10,2),
  description TEXT,
  features JSONB DEFAULT '[]',
  image_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add image_url to event_types for optional icon/image
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Seed service_catalog with current hardcoded data
INSERT INTO service_catalog (title, price, description, features, sort_order) VALUES
('Catering', NULL, 'Menú completo adaptado a tus preferencias', '["Entrantes variados","Plato principal a elegir","Postres caseros","Bebidas incluidas","Opciones vegetarianas y veganas","Adaptación a alergias"]', 1),
('Animación', NULL, 'Entretenimiento profesional para todas las edades', '["Animadores profesionales","Juegos y actividades","Música y baile","2 horas de animación","Material incluido","Espectáculo final"]', 2),
('Decoración', NULL, 'Ambientación temática personalizada', '["Globos y guirnaldas","Centros de mesa","Photocall personalizado","Iluminación especial","Vajilla decorativa","Montaje y desmontaje"]', 3),
('Fotografía', NULL, 'Reportaje fotográfico profesional', '["Fotógrafo profesional","3 horas de cobertura","200+ fotos editadas","Entrega digital en 7 días","Fotos en alta resolución","Álbum online compartible"]', 4),
('Tarta Personalizada', NULL, 'Tarta artesanal hecha a medida', '["Diseño personalizado","Hasta 20 porciones","Ingredientes premium","Sabores a elegir","Sin gluten disponible","Entrega y montaje"]', 5)
ON CONFLICT DO NOTHING;
