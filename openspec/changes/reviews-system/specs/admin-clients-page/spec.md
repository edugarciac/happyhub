## ADDED Requirements

### Requirement: Admin clients list page
El sistema SHALL proporcionar una página `/admin/clients` con listado de usuarios registrados.

#### Scenario: Admin views clients list
- **WHEN** el admin accede a `/admin/clients`
- **THEN** el sistema MUST mostrar tabla con: nombre, email, teléfono, rol, fecha de registro, email verificado (sí/no)
- **THEN** el sistema MUST permitir buscar por nombre o email
- **THEN** el sistema MUST soportar paginación

#### Scenario: Client count displayed
- **WHEN** el admin accede a la página
- **THEN** el sistema MUST mostrar el número total de clientes registrados

### Requirement: Clients API endpoint
El sistema SHALL proporcionar un endpoint `GET /api/admin/clients` para listar usuarios.

#### Scenario: API returns paginated users
- **WHEN** se llama a `GET /api/admin/clients?page=1&limit=20`
- **THEN** el sistema MUST devolver usuarios con campos: id, name, email, phone, role, email_verified, created_at
- **THEN** el sistema MUST requerir autenticación admin
