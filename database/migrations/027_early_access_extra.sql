-- Extra contratable: 1 hora adicional de acceso anticipado (montaje) por 30 €.
-- Aparece en el paso 2 de la reserva y suma al precio total. Ejecutar en Neon SQL Editor
-- (o crearlo desde el panel de administración > Servicios con los mismos datos).
INSERT INTO service_catalog (title, price, description, features, sort_order, active)
SELECT 'Acceso anticipado (1 hora extra)', 30.00,
       'Entra 1 hora y media antes del inicio de tu franja para montar la decoración con calma (30 minutos ya están incluidos).',
       '["1 hora adicional antes de tu franja","Ideal para decoración y montaje","Sujeto a disponibilidad de la franja anterior"]',
       0, true
WHERE NOT EXISTS (SELECT 1 FROM service_catalog WHERE title = 'Acceso anticipado (1 hora extra)');
