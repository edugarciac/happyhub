## Why

HappyHub currently lacks a centralized admin interface for managing business data. Admins need manual database access to manage reviews, clients, reservations, event types, providers, and services. A unified CRUD dashboard enables efficient data management and business operations without technical SQL knowledge.

## What Changes

- Add admin dashboard at `/admin/dashboard` with navigation menu showing 6 data management sections
- Implement full CRUD (Create, Read, Update, Delete) for each entity: reviews, users (clients), reservations, event_types, providers, services
- Redirect admin users to dashboard after successful login instead of home
- Add data tables with pagination, search/filter, and sorting capabilities
- Create forms for adding/editing records with validation
- Implement delete confirmations to prevent accidental data loss
- Add admin-only route protection (JWT role=admin required)

## Capabilities

### New Capabilities
- `admin-crud-reviews`: CRUD operations for reviews table (list, create, edit, delete, publish/unpublish)
- `admin-crud-clients`: CRUD operations for users table filtered by role=client (list, view details, edit profile, deactivate)
- `admin-crud-reservations`: CRUD operations for reservations table (list, create, edit status, view details, delete)
- `admin-crud-event-types`: CRUD operations for event_types table (list, create, edit, delete, reorder)
- `admin-crud-providers`: CRUD operations for providers table (list, create, edit, activate/deactivate, delete)
- `admin-crud-services`: CRUD operations for services table (list, create, edit, assign provider, delete)
- `admin-dashboard-navigation`: Main dashboard layout with menu and role-based access control

### Modified Capabilities
<!-- No existing capabilities are being modified at the requirements level -->

## Impact

**Authentication Flow:**
- Login redirect logic in `/api/auth` or client-side after JWT validation
- Admin users redirect to `/admin/dashboard` instead of `/`
- Non-admin users continue to home `/`

**New Pages:**
- `/admin/dashboard` - Main dashboard with navigation menu
- `/admin/reviews` - Reviews CRUD interface
- `/admin/clients` - Clients management interface
- `/admin/reservations` - Reservations management interface
- `/admin/event-types` - Event types configuration
- `/admin/providers` - Providers directory management
- `/admin/services` - Services catalog management

**New API Endpoints:**
- `GET /api/admin/users?role=client` - List clients with pagination
- `GET/POST/PATCH/DELETE /api/admin/reservations` - Reservation management
- `GET/POST/PATCH/DELETE /api/admin/event-types` - Event type configuration
- `GET/POST/PATCH/DELETE /api/admin/providers` - Provider management
- `GET/POST/PATCH/DELETE /api/admin/services` - Service management
- Enhancement to existing `/api/reviews/*` for admin list (unpublished included)

**UI Components:**
- `DataTable` component (reusable for all entities)
- `SearchBar` component with filter capabilities
- `Pagination` component
- `ConfirmDialog` component for delete confirmations
- `FormModal` component for create/edit operations
- `DashboardLayout` component with sidebar navigation

**Database:**
- No schema changes required (all tables exist)
- Existing tables: users, reservations, event_types, providers, services, reviews
