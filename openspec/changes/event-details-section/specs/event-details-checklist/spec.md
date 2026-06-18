# Spec: Checklist de detalles del evento

## Capability: event-details-checklist

### Scenario: Participante añade un ítem de detalle
- **GIVEN** un usuario autenticado que es participante u organizador del evento
- **WHEN** envía `POST /api/events/collaborative/[id]/detalles` con `title` y opcionalmente `category`, `description`, `quantity`, `responsible_participant_id`
- **THEN** se crea un `event_detail_items` con `added_by_participant_id` = participante actual y `done = false`
- **AND** se devuelve el ítem creado con status 201

### Scenario: Listar ítems
- **GIVEN** un usuario con acceso al evento
- **WHEN** envía `GET /api/events/collaborative/[id]/detalles`
- **THEN** recibe todos los ítems del evento ordenados por `created_at ASC`

### Scenario: Marcar ítem como hecho
- **GIVEN** cualquier participante u organizador del evento
- **WHEN** envía `PATCH /api/events/collaborative/[id]/detalles/[itemId]` con `{ done: true }`
- **THEN** el ítem se actualiza
- **AND** no requiere ser el autor del ítem

### Scenario: Eliminar ítem sin permiso
- **GIVEN** un participante que no es organizador ni autor del ítem
- **WHEN** envía `DELETE /api/events/collaborative/[id]/detalles/[itemId]`
- **THEN** recibe 403

### Scenario: Eliminar ítem con permiso
- **GIVEN** el organizador del evento o el participante que añadió el ítem
- **WHEN** envía `DELETE` sobre ese ítem
- **THEN** el ítem se elimina y responde 200

### Scenario: Usuario sin acceso al evento
- **GIVEN** un usuario autenticado que no es participante ni organizador
- **WHEN** llama a cualquier endpoint de `/detalles`
- **THEN** recibe 403
