# Design
Single source of truth for layout chrome: `src/pages/_app.tsx` (`AppContent`). Pages must not import `Header`/`Footer`. Admin pages keep their own `AdminLayout` (global chrome is skipped for `/admin`).
