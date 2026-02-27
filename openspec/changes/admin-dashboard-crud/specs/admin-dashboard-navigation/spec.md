## ADDED Requirements

### Requirement: Admin dashboard access control
The system SHALL restrict access to `/admin/dashboard` and all sub-routes to users with JWT role='admin' only.

#### Scenario: Admin user accesses dashboard
- **WHEN** a user with role='admin' navigates to /admin/dashboard
- **THEN** the system displays the admin dashboard with navigation menu

#### Scenario: Non-admin user blocked from dashboard
- **WHEN** a user with role='client' or 'provider' attempts to access /admin/dashboard
- **THEN** the system redirects to home with error message "Acceso denegado"

#### Scenario: Unauthenticated user blocked from dashboard
- **WHEN** an unauthenticated user attempts to access /admin/dashboard
- **THEN** the system redirects to /login with return URL preserved

### Requirement: Post-login redirect based on role
The system SHALL redirect users to appropriate pages after successful login based on their role.

#### Scenario: Admin login redirects to dashboard
- **WHEN** a user with role='admin' successfully logs in
- **THEN** the system redirects to /admin/dashboard

#### Scenario: Client login redirects to home
- **WHEN** a user with role='client' or 'provider' successfully logs in
- **THEN** the system redirects to / (home page)

### Requirement: Dashboard navigation menu
The system SHALL display a navigation menu with 6 management sections accessible to admin users.

#### Scenario: Navigation menu displays all sections
- **WHEN** an admin user views the dashboard
- **THEN** the system displays menu with: Reseñas, Clientes, Reservas, Tipos de Eventos, Proveedores, Servicios

#### Scenario: Active section highlighted
- **WHEN** an admin is viewing a specific section (e.g., /admin/reviews)
- **THEN** that menu item is visually highlighted as active

### Requirement: Responsive dashboard layout
The system SHALL provide a responsive layout that works on desktop and tablet devices.

#### Scenario: Desktop layout with sidebar
- **WHEN** dashboard is viewed on desktop (≥1024px width)
- **THEN** navigation menu displays as permanent sidebar

#### Scenario: Mobile layout with collapsible menu
- **WHEN** dashboard is viewed on mobile/tablet (<1024px width)
- **THEN** navigation menu displays as hamburger menu that can be toggled
