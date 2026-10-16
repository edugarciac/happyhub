-- Sustituye Boda y Comunión por Baby Shower en los tipos de evento de la home (2026-10-17).
-- Solo actúa si aún no existe "Baby Shower". También se aplica una vez en tiempo de ejecución (/api/event-types).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM event_types WHERE name = 'Baby Shower') THEN
    INSERT INTO event_types (name, description, icon, active, sort_order)
    VALUES ('Baby Shower', 'Celebra la llegada del bebé', '🍼', true,
            COALESCE((SELECT sort_order FROM event_types WHERE name = 'Comunión' LIMIT 1), 0));
    UPDATE event_types SET active = false WHERE name IN ('Boda', 'Comunión');
  END IF;
END
$$;
