## Why

En el panel de Home Assistant de la sala el audio "no acaba de funcionar": `script.encender_sala` termina a los 3 s, pero el amplificador (WiiM) tarda bastante más en arrancar y volver a la red. El cliente pulsa **Activar**, pone música enseguida y no suena. Además el panel no muestra si el amplificador y el subwoofer están encendidos, ni qué hay conectado ni cómo.

## What Changes

- Botón de sala con texto **Sala ON** / **Sala OFF** (según `sensor.estado_sala`); mientras arranca, «Encendiendo sala… El sonido tardará unos segundos» (no se puede pulsar).
- Nuevo botón **Música ON** (grupo Música y vista Gramola): enciende solo amplificador + subwoofer (`script.encender_musica`). Se oculta mientras arranca y el script ignora pulsaciones repetidas (`mode: single`, `max_exceeded: silent`).
- `script.encender_sala` enciende luces y llama a `script.encender_musica`, que espera (máx. 60 s) a que el WiiM esté disponible.
- Grupo **Música**: estado del sonido («Sonido listo»…) y Amplificador / Subwoofer encendido/apagado (solo lectura).
- La tarjeta de conexión muestra también origen (Bluetooth, Gramola/WiFi, Spotify, AirPlay, cable), app, canción, artista, estado y volumen.
- Sensores plantilla `sensor.estado_sala`, `sensor.estado_sonido_sala`, `sensor.conexion_musica_sala`.
- Gramola desactivada en el panel («Próximamente», gris, sin acción) y su guía de cliente retirada hasta tener las listas.
- Guías (cliente e interna) actualizadas.

## Capabilities

### New Capabilities

- `sala-panel`: estado del audio y botón de activación en el panel de la sala

## Impact

- Nuevo: `home-assistant/` (YAML para pegar en Home Assistant; el panel vive en HA, no en Vercel)
- `content/kb/panel-de-control.md`, `content/kb/operaciones/*.md`, `content/kb/zonas/sala-kids.md`, `content/interno/home-assistant.md`
