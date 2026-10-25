## Why

La integración con Spotify no se va a ofrecer por ahora (la app de Spotify sigue en modo desarrollo, limitada a usuarios añadidos a mano). Mostrarla genera conexiones que fallan y dudas de soporte. Hay que ocultarla sin borrar el código, para poder reactivarla.

## What Changes

- Nuevo `src/config/features.ts` con `SPOTIFY_ENABLED = false`
- Con el flag apagado:
  - `SpotifyConnectionCard` no se muestra en `/area-privada`
  - la pestaña "Música" (`musica`) no aparece en `EventSidebar`, y `/mis-eventos/[id]?section=musica` vuelve a la sección por defecto
  - `GET /api/account/spotify/connect` responde 404

## Capabilities

### Modified Capabilities

- `spotify-integration`: activable por flag

## Impact

- **Nuevo**: `src/config/features.ts`
- **Frontend**: `src/pages/area-privada.tsx`, `src/components/events/EventSidebar.tsx`, `src/pages/mis-eventos/[id].tsx`
- **Backend**: `src/pages/api/account/spotify/connect.ts`
- Sin cambios en BD: las conexiones guardadas se conservan
