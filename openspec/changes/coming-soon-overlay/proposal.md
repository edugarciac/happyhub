## Why

HappyHub aún no está abierto públicamente pero la web ya es visitable. Se necesita un overlay de bienvenida tipo "estamos casi listos" que informe a los visitantes del estado del lanzamiento, ofrezca un canal de contacto (WhatsApp) para avisos de apertura, y permita seguir navegando la web si el visitante lo desea, sin bloquear el acceso de forma permanente ni repetirse en cada página durante la misma sesión.

## What Changes

- **Nuevo componente `ComingSoonOverlay`**: overlay a pantalla completa con progreso de apertura (Reforma/Decoración/Apertura), CTA de WhatsApp (reutilizando `CONTACT_INFO.whatsapp`) y botón para cerrarlo y ver la web igualmente.
- **Persistencia por sesión de navegador**: se usa `sessionStorage` (clave `happyhub_intro_dismissed`) para no volver a mostrarlo tras cerrarlo, hasta que se cierre la pestaña/navegador.
- **Integración en `_app.tsx`**: se monta en el layout público (no en `/admin`, donde el overlay no aporta nada y podría bloquear el trabajo del equipo).

## Capabilities

### New Capabilities
- `coming-soon-overlay`: overlay de "casi listos" mostrado una vez por sesión en las páginas públicas

## Impact

- **Frontend**: nuevo `src/components/ComingSoonOverlay.tsx`, integrado en `src/pages/_app.tsx` (rama pública de `AppContent`, no en `isAdminPage`)
- Sin impacto en backend, base de datos ni endpoints existentes
