-- Add features list to event_types (same pattern as service_catalog)
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';

-- Seed features for existing event types
UPDATE event_types SET features = '["Decoración temática","Animación","Menú personalizado"]' WHERE name = 'Cumpleaños' AND features = '[]';
UPDATE event_types SET features = '["Ambiente acogedor","Catering adaptable","Espacio flexible"]' WHERE name = 'Reunión Familiar' AND features = '[]';
UPDATE event_types SET features = '["Ambiente divertido","Zona de juegos","DJ y música"]' WHERE name ILIKE '%amigo%' AND features = '[]';
UPDATE event_types SET features = '["Equipamiento A/V","Catering flexible","Configuración adaptable"]' WHERE name = 'Evento Corporativo' AND features = '[]';
