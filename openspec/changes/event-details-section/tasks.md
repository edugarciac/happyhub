# Tasks: event-details-section

## T1 — Migración DB
- [x] Crear `database/migrations/015_event_details_section.sql` con tabla `event_detail_items` e índice por `event_id`

## T2 — API endpoints
- [x] `src/pages/api/events/collaborative/[id]/detalles/index.ts` — GET lista, POST crear
- [x] `src/pages/api/events/collaborative/[id]/detalles/[itemId].ts` — PATCH actualizar, DELETE eliminar con checks de permisos

## T3 — Componente UI
- [x] `src/components/events/DetailsSection.tsx` — formulario añadir + lista agrupada por categoría + checkbox done + selector responsable + eliminar

## T4 — Wiring
- [x] `src/pages/mis-eventos/[id].tsx` — importar y usar `DetailsSection` en el case `'detalles'`, pasando `participants` para el selector de responsable

## T5 — Verificación
- [ ] Ejecutar migración en BD de desarrollo/producción
- [ ] Probar flujo completo en `/mis-eventos/[id]?section=detalles`: añadir, marcar hecho, asignar responsable, eliminar
- [ ] Commit y push a la rama de trabajo
