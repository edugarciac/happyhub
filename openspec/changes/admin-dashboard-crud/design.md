## Context

HappyHub has existing database tables (users, reservations, reviews, event_types, providers, services) managed manually via SQL or scattered API endpoints. Admin users currently access limited functionality through `/admin` page. The app uses Next.js 14 (Pages Router), JWT authentication with localStorage, and Neon PostgreSQL database.

Current admin page exists but lacks systematic data management. Need centralized interface for business operations without SQL knowledge.

## Goals / Non-Goals

**Goals:**
- Centralized admin dashboard accessible post-login for role='admin'
- Full CRUD operations for 6 core entities
- Reusable components (DataTable, FormModal, ConfirmDialog)
- Search, filter, pagination for all data tables
- Responsive design (desktop primary, tablet supported)

**Non-Goals:**
- Mobile admin interface (desktop/tablet only)
- Bulk operations (bulk delete, bulk edit)
- Export to CSV/Excel
- Advanced reporting or analytics dashboards
- Audit logging of admin actions
- Real-time collaborative editing
- Role-based permissions beyond admin vs non-admin
- Import data from external files

## Decisions

### Decision 1: Dashboard Layout Architecture

**Choice:** Sidebar navigation with content area using Next.js Pages Router.

**Structure:**
```
/admin/dashboard (layout page)
├── /admin/reviews (reviews CRUD)
├── /admin/clients (users CRUD)
├── /admin/reservations (reservations CRUD)
├── /admin/event-types (event types CRUD)
├── /admin/providers (providers CRUD)
└── /admin/services (services CRUD)
```

**Component Hierarchy:**
```tsx
<AdminLayout>  // Sidebar + header, wraps all admin pages
  <DashboardNav />  // Sidebar menu with 6 links
  <PageContent>
    <DataTable />  // Reusable table component
    <FormModal />  // Create/Edit forms
    <ConfirmDialog />  // Delete confirmations
  </PageContent>
</AdminLayout>
```

**Rationale:**
- Sidebar navigation standard for admin panels (familiar UX)
- Pages Router allows clean URLs and simple routing
- Reusable layout component reduces duplication
- Each entity gets dedicated page for maintainability

**Alternatives considered:**
- Tabs instead of pages: Rejected, loses URL state and bookmarking
- Single page with tab views: Rejected, harder to maintain as entities grow
- App Router: Rejected to maintain consistency with existing codebase (Pages Router)

### Decision 2: Reusable DataTable Component

**Choice:** Generic DataTable component with column configuration.

**Interface:**
```typescript
<DataTable
  data={records}
  columns={columnDefs}
  onEdit={(record) => handleEdit(record)}
  onDelete={(record) => handleDelete(record)}
  pagination={{ page, limit, total }}
  onPageChange={handlePageChange}
  searchable
  filterable
/>
```

**Features:**
- Column definitions with type, render function, sortable flag
- Inline edit mode or modal edit (configurable)
- Action column with edit/delete icons
- Search box filters across all columns
- Status badges for enum fields (status, role, etc.)

**Rationale:**
- DRY principle: 6 entities share 90% of table logic
- Configuration over duplication
- Easier to add new entities in future
- Consistent UX across all admin pages

**Alternatives considered:**
- Third-party library (react-table, ag-grid): Rejected to avoid external dependency and bundle size
- Separate table per entity: Rejected due to code duplication
- Server-side rendering for tables: Deferred to future optimization if needed

### Decision 3: API Endpoint Pattern

**Choice:** RESTful CRUD endpoints under `/api/admin/[entity]` namespace.

**Pattern:**
```
GET    /api/admin/reviews?page=1&limit=20&search=query&filter=status:published
POST   /api/admin/reviews (create)
PATCH  /api/admin/reviews/[id] (update)
DELETE /api/admin/reviews/[id] (delete)
```

**Authorization:**
- All endpoints check JWT token presence
- All endpoints verify `role === 'admin'`
- Return 401 if unauthenticated, 403 if not admin

**Rationale:**
- RESTful pattern is standard and predictable
- Consistent with existing API structure
- Easy to add new entities following same pattern
- Search and filter via query params keeps URLs bookmarkable

**Alternatives considered:**
- GraphQL API: Over-engineering for CRUD operations, adds complexity
- Single endpoint with action parameter: Less RESTful, harder to cache
- Separate auth check middleware: Deferred to refactoring phase

### Decision 4: Form Validation Strategy

**Choice:** Reuse existing Zod schemas where available, create new schemas for admin-specific operations.

**Location:** `src/utils/validators.ts` (extend existing file)

**New Schemas:**
```typescript
eventTypeSchema: z.object({ name, description, icon })
providerSchema: z.object({ name, service_type, email, phone, ... })
serviceSchema: z.object({ reservation_id, provider_id, service_name, price, ... })
// Reuse: reviewSchema, reservationSchema
```

**Rationale:**
- Consistency with existing validation patterns
- Centralized validation logic
- Zod provides excellent TypeScript integration
- Same schemas used for API validation and form validation

**Alternatives considered:**
- Separate validation for frontend and backend: Rejected, violates DRY
- No validation: Rejected, data integrity critical

### Decision 5: Delete Confirmation UX

**Choice:** Modal dialog with entity-specific warnings for cascade effects.

**Behavior:**
- Generic delete: "¿Eliminar este registro?"
- With dependencies: "Este registro tiene X dependencias. Continuar eliminará también..."
- Irreversible warning: "Esta acción no se puede deshacer"

**Implementation:**
- Check foreign key relationships before delete
- Show warning for cascading deletes
- Require explicit "Eliminar" button click (no accidental deletes)

**Rationale:**
- Prevents data loss from accidental clicks
- Educates admin about data relationships
- Standard UX pattern for destructive operations

**Alternatives considered:**
- Soft deletes (mark as deleted): Deferred to future, adds complexity
- Undo functionality: Out of scope for MVP
- No confirmation: Rejected, too risky for production data

### Decision 6: Pagination and Performance

**Choice:** Server-side pagination with page/limit query parameters, default 20 records per page.

**SQL Pattern:**
```sql
SELECT * FROM table
WHERE [filters]
ORDER BY [sort]
LIMIT $1 OFFSET $2
```

**Rationale:**
- Database handles pagination efficiently
- Reduces payload size for large tables
- Standard pagination pattern
- 20 records = ~1 screen height on desktop

**Alternatives considered:**
- Client-side pagination: Rejected, won't scale as data grows
- Infinite scroll: Rejected, harder to bookmark and navigate
- 50 or 100 records per page: Rejected, too much for quick scanning

## Risks / Trade-offs

**[Risk] Accidental data deletion by admin**
→ Mitigation: Mandatory confirmation dialogs, cascade warnings, no bulk delete in MVP.

**[Risk] No audit trail for admin actions**
→ Trade-off: Audit logging deferred to future phase. Accept limited accountability for MVP.

**[Risk] Performance degradation with large datasets**
→ Mitigation: Server-side pagination, database indexes on commonly filtered columns.

**[Risk] Concurrent admin edits causing conflicts**
→ Trade-off: Optimistic concurrency not implemented. Last write wins. Consider timestamp checks in future.

**[Risk] Complex foreign key relationships not visualized**
→ Mitigation: Show warnings before cascading deletes, document relationships in UI help text.

**[Trade-off] No batch operations**
→ Simplifies implementation, but requires repetitive clicks for multiple operations. Add in future if needed.

**[Trade-off] Desktop/tablet only (no mobile admin)**
→ Mobile admin rare use case, saves development time. Can add progressive enhancement later.

## Migration Plan

**Phase 1: Core Infrastructure**
1. Create AdminLayout component with sidebar
2. Implement route protection middleware/HOC
3. Build reusable DataTable component
4. Build reusable FormModal and ConfirmDialog components

**Phase 2: API Development**
1. Create CRUD endpoints for each entity (/api/admin/[entity])
2. Implement pagination, search, filter logic
3. Add admin role authorization checks
4. Test with Postman

**Phase 3: Entity Pages (in order)**
1. Reviews (/admin/reviews) - simplest, good starting point
2. Clients (/admin/clients) - straightforward user management
3. Reservations (/admin/reservations) - most complex, central entity
4. Event Types (/admin/event-types) - simple lookup table
5. Providers (/admin/providers) - medium complexity
6. Services (/admin/services) - involves relationships

**Phase 4: Login Redirect**
1. Update /api/auth or client-side login logic
2. Check JWT role after login
3. Redirect admin to /admin/dashboard, others to /

**Rollback Strategy:**
- Remove /admin routes (keep existing /admin page as fallback)
- Remove AdminLayout component
- Remove /api/admin endpoints
- Revert login redirect to always go to /

## Open Questions

1. **Edit mode:** Inline editing in table or modal form? → Decision: Modal for complex entities (reservations, providers), inline for simple fields (event type name).

2. **Search implementation:** Client-side filter or server-side query? → Decision: Server-side for scalability.

3. **Success notifications:** Toast notifications or inline messages? → Decision: Toast notifications using react-hot-toast library.

4. **Table library:** Build custom or use library? → Decision: Custom DataTable component for control and bundle size.

5. **Loading states:** Skeleton loaders or spinners? → Decision: Spinners for simplicity in MVP, can enhance to skeletons later.
