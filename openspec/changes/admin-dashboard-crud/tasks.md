## 1. Core Infrastructure

- [ ] 1.1 Create src/components/admin/AdminLayout.tsx with sidebar navigation and header
- [ ] 1.2 Create src/components/admin/DashboardNav.tsx with 6 menu items (Reviews, Clients, Reservations, Event Types, Providers, Services)
- [ ] 1.3 Add route protection HOC or middleware for admin-only pages
- [ ] 1.4 Install react-hot-toast for notifications: npm install react-hot-toast
- [ ] 1.5 Create src/utils/adminAuth.ts with verifyAdminToken helper function

## 2. Reusable Components

- [ ] 2.1 Create src/components/admin/DataTable.tsx with generic column configuration
- [ ] 2.2 Add search, filter, and pagination props to DataTable
- [ ] 2.3 Add sorting capability (click column header to sort)
- [ ] 2.4 Create src/components/admin/FormModal.tsx for create/edit operations
- [ ] 2.5 Create src/components/admin/ConfirmDialog.tsx for delete confirmations
- [ ] 2.6 Create src/components/admin/Pagination.tsx component
- [ ] 2.7 Create src/components/admin/SearchBar.tsx component
- [ ] 2.8 Style all components with Tailwind following HappyHub design system

## 3. Validation Schemas

- [ ] 3.1 Add eventTypeSchema to src/utils/validators.ts (name, description, icon)
- [ ] 3.2 Add providerSchema to src/utils/validators.ts (name, service_type, email, phone, description, price_range)
- [ ] 3.3 Add serviceSchema to src/utils/validators.ts (reservation_id, provider_id, service_name, price, status)
- [ ] 3.4 Add clientUpdateSchema for updating user profiles
- [ ] 3.5 Add reservationAdminSchema for admin reservation creation/updates

## 4. API - Reviews CRUD

- [ ] 4.1 Create GET /api/admin/reviews endpoint with pagination (include unpublished)
- [ ] 4.2 Add search and filter support (by is_published, rating, date range)
- [ ] 4.3 Enhance existing PATCH /api/reviews/[id]/publish to support unpublish
- [ ] 4.4 Create DELETE /api/admin/reviews/[id] endpoint with admin auth check
- [ ] 4.5 Test all review CRUD endpoints with Postman

## 5. API - Clients CRUD

- [ ] 5.1 Create GET /api/admin/users endpoint with role=client filter and pagination
- [ ] 5.2 Add search support (by name, email)
- [ ] 5.3 Create GET /api/admin/users/[id] endpoint for user details with reservations
- [ ] 5.4 Create PATCH /api/admin/users/[id] endpoint for updating client info
- [ ] 5.5 Create DELETE /api/admin/users/[id] with cascade warning check
- [ ] 5.6 Test all client CRUD endpoints

## 6. API - Reservations CRUD

- [ ] 6.1 Create GET /api/admin/reservations endpoint with pagination and filters (status, date range)
- [ ] 6.2 Add search support (by user email, ID)
- [ ] 6.3 Create POST /api/admin/reservations endpoint for manual reservation creation
- [ ] 6.4 Create PATCH /api/admin/reservations/[id] endpoint for status updates and edits
- [ ] 6.5 Create DELETE /api/admin/reservations/[id] with Google Calendar cleanup
- [ ] 6.6 Test all reservation CRUD endpoints

## 7. API - Event Types CRUD

- [ ] 7.1 Create GET /api/admin/event-types endpoint (all records, no pagination needed)
- [ ] 7.2 Create POST /api/admin/event-types endpoint for creating new event types
- [ ] 7.3 Create PATCH /api/admin/event-types/[id] endpoint for editing
- [ ] 7.4 Create DELETE /api/admin/event-types/[id] with reservation count check
- [ ] 7.5 Test all event type CRUD endpoints

## 8. API - Providers CRUD

- [ ] 8.1 Create GET /api/admin/providers endpoint with pagination and service_type filter
- [ ] 8.2 Add search support (by name, service_type)
- [ ] 8.3 Create POST /api/admin/providers endpoint for adding new providers
- [ ] 8.4 Create PATCH /api/admin/providers/[id] endpoint for editing and activate/deactivate
- [ ] 8.5 Create DELETE /api/admin/providers/[id] with services count check
- [ ] 8.6 Test all provider CRUD endpoints

## 9. API - Services CRUD

- [ ] 9.1 Create GET /api/admin/services endpoint with pagination and status filter
- [ ] 9.2 Add search support (by service_name, provider_id, reservation_id)
- [ ] 9.3 Create POST /api/admin/services endpoint for creating services
- [ ] 9.4 Create PATCH /api/admin/services/[id] endpoint for editing price and status
- [ ] 9.5 Create DELETE /api/admin/services/[id] endpoint
- [ ] 9.6 Test all service CRUD endpoints

## 10. Dashboard Main Page

- [ ] 10.1 Create src/pages/admin/dashboard.tsx as main entry point
- [ ] 10.2 Use AdminLayout component wrapper
- [ ] 10.3 Show welcome message and quick stats (total users, reservations, reviews)
- [ ] 10.4 Add cards linking to each management section
- [ ] 10.5 Test dashboard loads correctly for admin users

## 11. Reviews Management Page

- [ ] 11.1 Create src/pages/admin/reviews.tsx using AdminLayout
- [ ] 11.2 Fetch reviews from GET /api/admin/reviews with pagination
- [ ] 11.3 Configure DataTable with columns: ID, customer_name, rating, review_text preview, is_published, created_at
- [ ] 11.4 Add "Publicar/Ocultar" toggle button in actions column
- [ ] 11.5 Add delete button with ConfirmDialog
- [ ] 11.6 Add filter dropdown for publication status
- [ ] 11.7 Test full CRUD flow on reviews page

## 12. Clients Management Page

- [ ] 12.1 Create src/pages/admin/clients.tsx using AdminLayout
- [ ] 12.2 Fetch clients from GET /api/admin/users?role=client
- [ ] 12.3 Configure DataTable with columns: ID, name, email, phone, created_at
- [ ] 12.4 Add "Ver Detalles" button to show modal with client profile and reservations
- [ ] 12.5 Add edit button with FormModal for updating name, email, phone
- [ ] 12.6 Add delete button with cascade warning if reservations exist
- [ ] 12.7 Add search bar for name/email filtering
- [ ] 12.8 Test full CRUD flow on clients page

## 13. Reservations Management Page

- [ ] 13.1 Create src/pages/admin/reservations.tsx using AdminLayout
- [ ] 13.2 Fetch reservations from GET /api/admin/reservations
- [ ] 13.3 Configure DataTable with columns: ID, user (name/email), event_date, time_slot, status, guests, total_price
- [ ] 13.4 Add status badges with colors (pending=yellow, confirmed=green, cancelled=red)
- [ ] 13.5 Add "Nueva Reserva" button opening FormModal with reservation form
- [ ] 13.6 Add edit button with FormModal for updating reservation details
- [ ] 13.7 Add status dropdown for quick status changes
- [ ] 13.8 Add delete button with Google Calendar cleanup warning
- [ ] 13.9 Add filters: status, date range
- [ ] 13.10 Test full CRUD flow on reservations page

## 14. Event Types Management Page

- [ ] 14.1 Create src/pages/admin/event-types.tsx using AdminLayout
- [ ] 14.2 Fetch event types from GET /api/admin/event-types
- [ ] 14.3 Configure DataTable with columns: ID, name, description, icon, created_at
- [ ] 14.4 Add "Nuevo Tipo" button opening FormModal
- [ ] 14.5 Add inline edit for name and description fields
- [ ] 14.6 Add delete button with reservation count check
- [ ] 14.7 Test full CRUD flow on event types page

## 15. Providers Management Page

- [ ] 15.1 Create src/pages/admin/providers.tsx using AdminLayout
- [ ] 15.2 Fetch providers from GET /api/admin/providers
- [ ] 15.3 Configure DataTable with columns: ID, name, service_type, email, phone, active, created_at
- [ ] 15.4 Add active/inactive status toggle button
- [ ] 15.5 Add "Nuevo Proveedor" button opening FormModal
- [ ] 15.6 Add edit button with FormModal for all provider fields
- [ ] 15.7 Add delete button with services count check
- [ ] 15.8 Add filter by service_type dropdown
- [ ] 15.9 Test full CRUD flow on providers page

## 16. Services Management Page

- [ ] 16.1 Create src/pages/admin/services.tsx using AdminLayout
- [ ] 16.2 Fetch services from GET /api/admin/services
- [ ] 16.3 Configure DataTable with columns: ID, service_name, service_type, provider (name), reservation (ID), price, status
- [ ] 16.4 Add "Nuevo Servicio" button opening FormModal with provider and reservation dropdowns
- [ ] 16.5 Add edit button with FormModal
- [ ] 16.6 Add status dropdown for workflow management
- [ ] 16.7 Add delete button with confirmation
- [ ] 16.8 Add filters: status, service_type
- [ ] 16.9 Test full CRUD flow on services page

## 17. Login Redirect Logic

- [ ] 17.1 Update login page (src/pages/login.tsx) to check JWT role after authentication
- [ ] 17.2 If role='admin', redirect to /admin/dashboard instead of /
- [ ] 17.3 If role='client' or 'provider', redirect to / (home)
- [ ] 17.4 Test login flow for admin user redirects correctly
- [ ] 17.5 Test login flow for non-admin users still go to home

## 18. Styling and UX Polish

- [ ] 18.1 Add consistent spacing and typography to all admin pages
- [ ] 18.2 Implement loading states (spinners) during API calls
- [ ] 18.3 Add empty states for tables with no records ("No hay registros aún")
- [ ] 18.4 Add toast notifications for success/error messages using react-hot-toast
- [ ] 18.5 Ensure all forms have proper validation error messages
- [ ] 18.6 Test responsive design on tablet (≥768px)
- [ ] 18.7 Add hover states and transitions to interactive elements

## 19. Testing and Edge Cases

- [ ] 19.1 Test admin dashboard access with non-admin JWT (should be blocked)
- [ ] 19.2 Test all delete confirmations work correctly
- [ ] 19.3 Test pagination works with different page sizes
- [ ] 19.4 Test search and filter combinations
- [ ] 19.5 Test form validation prevents invalid data submission
- [ ] 19.6 Test cascade warnings show correct dependency counts
- [ ] 19.7 Verify all API endpoints return proper error messages for unauthorized access

## 20. Documentation and Deployment

- [ ] 20.1 Update docs/project_notes/key_facts.md with new admin API endpoints
- [ ] 20.2 Update docs/project_notes/decisions.md with ADR for dashboard architecture
- [ ] 20.3 Add screenshots or walkthrough to admin documentation
- [ ] 20.4 Test full admin workflow end-to-end before production deployment
- [ ] 20.5 Deploy to production and verify all CRUDs work correctly
