# Tasks: coming-soon-overlay

## T1 — Crear el componente

**Archivo**: `src/components/ComingSoonOverlay.tsx` (nuevo)

- Estado `visible`, inicializado en `false`; `useEffect` en mount que lo pone a `true` si `sessionStorage.getItem('happyhub_intro_dismissed')` no existe
- `useEffect` ligado a `visible` que fija `document.body.style.overflow = 'hidden'` mientras está visible y lo restaura al cerrar/desmontar
- `close()`: marca `sessionStorage.setItem('happyhub_intro_dismissed', '1')` y pone `visible` a `false`
- Si `!visible`, devuelve `null`
- Markup: overlay a pantalla completa con círculo de progreso, logo (`/happyhub_logo_cara.png`), badge "92%", título, copy, pasos (Reforma/Decoración/Apertura) y dos CTAs
- CTA "Avísame cuando abráis": `<a>` a `` `${CONTACT_INFO.whatsapp}?text=...` `` (importado de `@/config/contact`), `target="_blank"`, `rel="noopener noreferrer"`
- CTA "Ver la web igualmente": botón que llama a `close()`

## T2 — Integrar en `_app.tsx`

**Archivo**: `src/pages/_app.tsx`

- Importar `ComingSoonOverlay` desde `@/components/ComingSoonOverlay`
- Añadir `<ComingSoonOverlay />` dentro del `return` público de `AppContent` (no en la rama `isAdminPage`), antes de `<Component {...pageProps} />`

## T3 — Verificación manual

- `npx tsc --noEmit` sin nuevos errores
- Abrir una página pública en una sesión nueva del navegador: el overlay aparece, bloquea el scroll
- Cerrarlo con ✕ o "Ver la web igualmente": desaparece, el scroll vuelve, y navegar a otra página pública en la misma pestaña no lo vuelve a mostrar
- Click en "Avísame cuando abráis" abre WhatsApp con el número real de `CONTACT_INFO.whatsapp`
- Abrir `/admin`: el overlay no aparece
