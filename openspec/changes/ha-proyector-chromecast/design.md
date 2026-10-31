## Context

El proyector no tiene control (se enciende con el mando). El Chromecast «Proyector» va conectado a él; en Home Assistant (integración Google Cast) aparece como `media_player.proyector` (**verificar el id real**).

## Decisions

- **"Proyector encendido" = Chromecast disponible.** Si el Chromecast se alimenta del USB del proyector, se apaga con él y pasa a `unavailable`. Si tiene alimentación propia, seguirá disponible con el proyector apagado: en ese caso el estado «Listo» no garantiza que el proyector esté encendido (hasta tener emisor IR o un enchufe con medición). Se documenta.
- **Estado en un sensor plantilla** `sensor.estado_proyector`: `apagado` (unavailable/unknown), `fondo` (el contenido es un fichero de `happyhub/proyector`), `proyectando` (playing/paused/buffering con otro contenido), `listo` (resto).
- **Fondo HappyHub con `media_player.play_media` + `media-source://media_source/local/happyhub/proyector/<fichero>`**: los ficheros van en `/media/happyhub/proyector/` de HA, que genera una URL firmada con su dirección interna. La dirección interna de HA debe ser una IP (el Chromecast no resuelve `homeassistant.local`).
- **Elección del cliente** en `input_select.fondo_proyector`. El panel muestra una tarjeta por opción; la seleccionada se resalta.
- **Automatización** `proyector_fondo_auto`: al pasar a `listo` durante 10 s, o al cambiar la elección, ejecuta `script.proyector_poner_fondo` solo si el estado es `listo` o `fondo`. Nunca con `proyectando`: no se pisa a un cliente.
- **«Fondo del Chromecast»**: si está mostrando el fondo HappyHub, se para (`media_player.turn_off`) y el Chromecast vuelve a su modo ambiente.
- **Antirrebote**: script `mode: single` + `max_exceeded: silent`; seleccionar la opción ya elegida no cambia nada.

## Risks

- Repetición del vídeo: al terminar, el Chromecast queda libre y la automatización lo vuelve a poner (pausa de ~10 s). Probar en la sala.
- Imagen: algunos Chromecast ponen `idle` al mostrar una imagen; el sensor detecta el fondo por el contenido y no por el estado, así que no hay bucle.
