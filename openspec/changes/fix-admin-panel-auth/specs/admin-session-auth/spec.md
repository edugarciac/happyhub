## ADDED Requirements

### Requirement: Admin panel requires authenticated admin session
El sistema SHALL verificar que existe una sesión next-auth activa con rol `admin` antes de renderizar cualquier página del panel de administración.

#### Scenario: Admin user accesses admin panel
- **WHEN** un usuario con sesión activa y rol `admin` navega a `/admin/dashboard`
- **THEN** el sistema MUST renderizar el contenido del panel admin

#### Scenario: Non-admin user accesses admin panel
- **WHEN** un usuario con sesión activa pero rol `client` navega a `/admin/dashboard`
- **THEN** el sistema MUST redirigir a `/login`

#### Scenario: Unauthenticated user accesses admin panel
- **WHEN** un usuario sin sesión navega a `/admin/dashboard`
- **THEN** el sistema MUST redirigir a `/login`

#### Scenario: Session loading state
- **WHEN** la sesión de next-auth está en estado `loading`
- **THEN** el sistema MUST no renderizar contenido del panel admin (retorna null)

### Requirement: Admin logout uses next-auth signOut
El sistema SHALL usar `signOut()` de next-auth para cerrar sesión desde el panel admin.

#### Scenario: Admin clicks logout
- **WHEN** el usuario admin hace clic en "Cerrar Sesión" en el sidebar
- **THEN** el sistema MUST llamar a `signOut({ callbackUrl: '/' })` y redirigir al inicio
