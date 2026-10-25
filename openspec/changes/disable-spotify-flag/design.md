## Decisions

- **Constante en código, no variable de entorno**: es una decisión de producto que cambia poco; una constante se elimina en build (el código oculto no llega al bundle) y no hace falta tocar Vercel.
- **404 en `connect`**: es el punto de entrada del flujo OAuth; sin él no se crean conexiones nuevas. `callback` no necesita bloqueo (sin `connect` no hay `state` válido).
- **Fallback de `?section=musica`**: se trata como sección por defecto (`invitados`) para que los enlaces antiguos no muestren la playlist.
- **Fuera de alcance**: el resto de endpoints de Spotify (`status`, `playlists`, `disconnect`, `sync`, `search`) siguen activos; dejan de ser accesibles desde la UI. Se pueden bloquear después si hiciera falta.
