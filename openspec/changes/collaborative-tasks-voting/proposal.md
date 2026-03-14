## Why

La organizacion de un evento en grupo requiere dos cosas que hoy se hacen de forma caotica: asignar tareas (quien trae que, quien se encarga de que) y tomar decisiones colectivas (que restaurante, que tema, que fecha alternativa). Hoy esto se hace en WhatsApp con mensajes que se pierden y polls limitados. Un sistema de tareas + votaciones integrado en el evento elimina este caos.

## What changes

### Tareas
- El organizador o cualquier co-organizador crea tareas con titulo, descripcion, fecha limite y presupuesto estimado
- Las tareas se pueden asignar a un participante o dejar abiertas para que alguien las reclame
- Cada tarea tiene estados: pendiente, en progreso, completada
- Vista Kanban y vista lista
- Notificacion cuando se asigna una tarea o se acerca la fecha limite
- Las tareas pueden tener un gasto asociado (link con expense-splitting)

### Votaciones
- Crear votacion con pregunta y opciones (texto o imagenes)
- Tipos: opcion unica, opcion multiple, si/no, ranking
- Fecha limite para votar
- Resultados en tiempo real (opcionales: ocultos hasta cierre)
- Notificacion a participantes cuando se crea una votacion
- Compartir votacion via WhatsApp (link directo a la votacion)

## Capabilities

### New capabilities
- `collaborative-tasks`: Gestion de tareas del evento con asignacion, estados y fechas limite
- `collaborative-voting`: Sistema de votaciones con multiples tipos y resultados en tiempo real

### Modified capabilities
- `collaborative-event-dashboard`: Anadir tabs de Tareas y Votaciones
- `collaborative-event-notifications`: Notificaciones de tareas asignadas, votaciones nuevas, fechas limite

## Impact

**Database:**

```sql
-- Tareas
CREATE TABLE collaborative_event_tasks (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES collaborative_event_participants(id),
  created_by INTEGER NOT NULL REFERENCES collaborative_event_participants(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  due_date DATE,
  estimated_budget DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  expense_id INTEGER, -- FK to expenses table when expense-splitting is implemented
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Votaciones
CREATE TABLE collaborative_event_votes (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES collaborative_event_participants(id),
  question VARCHAR(500) NOT NULL,
  vote_type VARCHAR(50) DEFAULT 'single', -- single, multiple, yes_no, ranking
  results_visible BOOLEAN DEFAULT true, -- mostrar resultados antes de cerrar
  closes_at TIMESTAMP,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Opciones de votacion
CREATE TABLE collaborative_event_vote_options (
  id SERIAL PRIMARY KEY,
  vote_id INTEGER NOT NULL REFERENCES collaborative_event_votes(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Respuestas
CREATE TABLE collaborative_event_vote_responses (
  id SERIAL PRIMARY KEY,
  vote_id INTEGER NOT NULL REFERENCES collaborative_event_votes(id) ON DELETE CASCADE,
  option_id INTEGER NOT NULL REFERENCES collaborative_event_vote_options(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES collaborative_event_participants(id),
  rank_position INTEGER, -- solo para tipo ranking
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vote_id, option_id, participant_id)
);
```

**API endpoints:**
- `GET/POST /api/events/collaborative/[id]/tasks` - Listar/crear tareas
- `PATCH /api/events/collaborative/[id]/tasks/[taskId]` - Actualizar tarea (estado, asignacion)
- `DELETE /api/events/collaborative/[id]/tasks/[taskId]` - Eliminar tarea
- `POST /api/events/collaborative/[id]/tasks/[taskId]/claim` - Reclamar tarea abierta
- `GET/POST /api/events/collaborative/[id]/votes` - Listar/crear votaciones
- `POST /api/events/collaborative/[id]/votes/[voteId]/respond` - Votar
- `GET /api/events/collaborative/[id]/votes/[voteId]/results` - Resultados
- `POST /api/events/collaborative/[id]/votes/[voteId]/close` - Cerrar votacion

**UI components:**
- `TaskBoard` - Vista Kanban con columnas pendiente/en progreso/completada
- `TaskList` - Vista lista alternativa
- `TaskCard` - Card de tarea con asignado, fecha, presupuesto
- `TaskForm` - Formulario crear/editar tarea
- `VoteCard` - Card de votacion con opciones y resultados
- `VoteForm` - Formulario crear votacion con opciones dinamicas
- `VoteResults` - Visualizacion de resultados (barras, porcentajes)
