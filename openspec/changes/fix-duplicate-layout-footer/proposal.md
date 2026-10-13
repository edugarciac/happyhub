# Fix duplicated Header/Footer on event pages

## Why
A customer reported the footer appearing twice on "Mis Eventos". `_app.tsx` already renders `Header` and `Footer` globally, but three pages also render them themselves.

## What changes
- Remove page-level `<Header />` and `<Footer />` from `mis-eventos.tsx`, `eventos/crear.tsx`, `eventos/unirse/[inviteCode].tsx`.

## Impact
Visual only. No API or data changes.
