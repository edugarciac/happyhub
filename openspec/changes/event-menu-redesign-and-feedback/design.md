## Decisions

1. **EventSidebar responsive pattern**: `hidden md:flex` vertical sidebar (icon+label rows) + `md:hidden` fixed bottom bar (icon-only) reusing the same `SECTIONS` array — no separate mobile component needed.
2. **Música/Actividades routing**: reuse existing `SpotifyPlaylistTab` / `ActivitiesTab` components directly as new top-level `case`s in `mis-eventos/[id].tsx`, instead of going through `EntertainmentSection`'s internal tab state. `EntertainmentSection.tsx` becomes unused but is left in place (not deleted) in case Detalles/other flows still reference it.
3. **Feedback table**: minimal columns — `id, message, page_path, user_id (nullable), created_at`. No status/read-tracking for v1 (YAGNI — admin view is just a chronological list).
4. **WhatsApp notification**: reuse `sendAdminNotification()` from `src/lib/whatsapp.ts` (already sends to `ADMIN_WHATSAPP_NUMBER`) — no new WhatsApp integration code needed.
5. **Feedback widget placement**: mounted in `_app.tsx` next to `CookieConsent`, hidden when `router.pathname.startsWith('/admin')`, bottom-left to avoid clashing with the Hero's floating WhatsApp card (bottom-right) and any future chat widgets.

## Risks / Trade-offs

- [Riesgo] Quitar Música/Actividades de dentro de Entretenimiento dejará `EntertainmentSection.tsx` sin usar → se deja el fichero pero no se borra, por si se revierte.
- [Riesgo] El WhatsApp de feedback usa el mismo número admin que las reservas — mismo hilo de conversación, aceptado por simplicidad (no se pidió un canal separado).
