# Spec: Blocked Slots UI

## Admin Reservations Index — Button

**File**: `src/pages/admin/reservations/index.tsx`

Add a button "Bloquear fechas" in the page header action area, next to any existing action buttons. Style: secondary/outline button with `CalendarX` icon (already imported in this file). Links to `/admin/reservations/blocked-dates`.

---

## Blocked Dates Management Page

**File**: `src/pages/admin/reservations/blocked-dates.tsx`

Uses `AdminLayout`. Two sections:

### Section 1: Creation Form

```
┌─────────────────────────────────────────────────────┐
│  Bloquear fechas                                     │
│                                                      │
│  Fecha inicio: [2026-06-10]  Fecha fin: [2026-06-10]│
│                                                      │
│  Franjas:  [x] Mañana   [x] Tarde   [x] Noche      │
│            [Seleccionar todas]                       │
│                                                      │
│  Motivo (opcional): [________________________]       │
│                                                      │
│                              [Bloquear fechas]       │
└─────────────────────────────────────────────────────┘
```

- Date inputs: `<input type="date">`, min = today
- endDate defaults to startDate value; updates when startDate changes if endDate < startDate
- At least one time slot must be selected (validated before submit)
- Submit button disabled while loading
- On success: show success toast, reload list, reset form (keep dates, clear reason)

### Section 2: Blocked Slots List

```
┌─────────────────────────────────────────────────────┐
│  Bloqueos activos            [x] Ver histórico       │
│                                                      │
│  [ ] Fecha      Franja   Motivo              Acc.   │
│  [x] 10 jun    Mañana   Mantenimiento HVAC  [✏][🗑] │
│  [ ] 10 jun    Tarde    Mantenimiento HVAC  [✏][🗑] │
│  [ ] 11 jun    Mañana   —                   [✏][🗑] │
│                                                      │
│  [Eliminar seleccionados (2)]                        │
└─────────────────────────────────────────────────────┘
```

- Default: show only slot_date >= today; toggle "Ver histórico" shows all
- Checkbox per row + header checkbox (select all visible)
- "Eliminar seleccionados" button appears when ≥1 row selected, shows count
- Confirm dialog before deletion: "¿Eliminar X bloqueos? Esta acción no se puede deshacer."
- Edit reason inline: clicking ✏ turns the reason cell into an input; pressing Enter or clicking outside saves via PATCH; Escape cancels
- Delete single row: clicking 🗑 shows confirm dialog for that slot
- Empty state: "No hay bloqueos activos. Usa el formulario de arriba para añadir fechas bloqueadas."

---

## Admin Calendar — Visual Differentiation

**File**: `src/pages/admin/calendar.tsx`

- Change data source from current booked-slots to `GET /api/admin/booked-slots`
- Slots with `type: 'blocked'`:
  - Background: amber/orange (`bg-amber-100`, text `text-amber-800`)
  - Show small lock icon (`🔒` or Lucide `Lock` icon, 12px)
  - Tooltip on hover: shows `reason` if present, else "Bloqueado (admin)"
- Slots with `type: 'reservation'`: unchanged (existing styles)
- Legend row updated: add amber swatch + "Bloqueado (admin)" label
