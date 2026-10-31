## Why

En el panel de Home Assistant de la sala el audio "no acaba de funcionar": `script.encender_sala` termina a los 3 s, pero el amplificador (WiiM) tarda bastante más en arrancar y volver a la red. El cliente pulsa **Activar**, pone música enseguida y no suena. Además el panel no muestra si el amplificador y el subwoofer están encendidos, ni qué hay conectado ni cómo.

## What Changes

- Un único botón que cambia de texto: **Activar SALA** / **Desactivar SALA**.
- Mientras arranca, el botón se sustituye por el aviso «Activando la sala… el sonido tardará unos segundos».
- `script.encender_sala` espera (máx. 60 s) a que el WiiM esté disponible antes de terminar, así el aviso dura lo que tarda de verdad.
- Nueva tarjeta **Equipo de sonido**: Amplificador y Subwoofer encendido/apagado (solo lectura) y estado global.
- Nueva tarjeta **Qué está sonando**: origen (Bluetooth, Gramola/WiFi, Spotify, AirPlay, cable), app, canción, artista, estado y volumen.
- Sensores plantilla `sensor.estado_sonido_sala` y `sensor.conexion_musica_sala`.
- Guías (cliente e interna) actualizadas con los nuevos textos.

## Capabilities

### New Capabilities

- `sala-panel`: estado del audio y botón de activación en el panel de la sala

## Impact

- Nuevo: `home-assistant/` (YAML para pegar en Home Assistant; el panel vive en HA, no en Vercel)
- `content/kb/panel-de-control.md`, `content/kb/operaciones/*.md`, `content/kb/zonas/sala-kids.md`, `content/interno/home-assistant.md`
