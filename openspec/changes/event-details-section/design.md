## Schema

```sql
CREATE TABLE IF NOT EXISTS event_detail_items (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'other', -- 'decoration' | 'favors' | 'special_request' | 'other'
  description TEXT,
  quantity INTEGER,
  responsible_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  added_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_detail_items_event ON event_detail_items(event_id);
```

Sigue el mismo patrón que `event_gift_items` (013) y `entertainment` (014): tabla simple ligada a `collaborative_events`, sin tabla de schema-ensure separada (se crea vía migración SQL, no vía `ensureCollaborativeEventsSchema()`).

## API

Mismo patrón de auth que `regalo`: sesión requerida, el usuario debe ser participante u organizador del evento.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/events/collaborative/[id]/detalles` | Lista de ítems del evento |
| POST | `/api/events/collaborative/[id]/detalles` | Crear ítem (title requerido, category/description/quantity/responsible_participant_id opcionales) |
| PATCH | `/api/events/collaborative/[id]/detalles/[itemId]` | Actualizar campos (incluye toggle `done`, asignar `responsible_participant_id`) |
| DELETE | `/api/events/collaborative/[id]/detalles/[itemId]` | Eliminar — solo organizador o quien lo añadió |

## UI

`DetailsSection.tsx` sigue el patrón visual de `GiftSection.tsx`:
- Formulario inline para añadir ítem (título, categoría con selector, descripción, cantidad)
- Lista de ítems agrupados visualmente por categoría con icono distintivo (🎈 decoración, 🎁 favors, ⚠️ petición especial, 📌 otro)
- Checkbox para marcar como hecho (cualquier participante)
- Selector de responsable (dropdown de participantes) — opcional
- Botón eliminar visible solo para organizador o autor del ítem
