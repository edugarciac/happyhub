## Context

El dashboard `panel-clientes` y los scripts viven en Home Assistant, no en este repo. Se versiona aquí el YAML para pegarlo en HA.

## Decisions

- **Mismo estilo que el panel actual** (mushroom + card_mod, ya instalados vía HACS). Se parte del YAML real de la tablet, versionado en un commit previo, para que el diff muestre solo el cambio.
- **Si falta el sensor**, las condiciones usan `state_not` y se ven Activar y Desactivar a la vez (comportamiento anterior): nunca se queda el panel sin botón.
- **Estado derivado en un sensor plantilla** (`sensor.estado_sonido_sala`: `apagado` / `arrancando` / `listo` / `incompleto`) para que todas las tarjetas lean una sola fuente.
  - `arrancando` = `script.encender_sala` en marcha.
  - `listo` = amplificador ON + subwoofer ON + WiiM disponible.
  - `incompleto` = cualquier mezcla (p. ej. subwoofer apagado): se muestra **Sala ON** y **Sala OFF** para poder arreglarlo.
- **Conexión**: se amplía la tarjeta existente (mantiene «Listo para conectar» / «Móvil conectado», que usa la guía) en vez de añadir otra.
- **El sonido se enciende en un script propio** (`script.encender_musica`) que reutiliza `encender_sala`. Espera al WiiM (`wait_template`, timeout 60 s, continúa si vence) en vez de un delay fijo.
- **Antirrebote en dos capas**: el panel oculta el botón mientras el script está en marcha, y los scripts usan `mode: single` + `max_exceeded: silent` por si llega una pulsación antes de que el panel se actualice.
- **Dos sensores**: `estado_sala` (luces + sonido) para Sala ON/OFF y `estado_sonido_sala` (solo sonido) para Música ON. Así Música ON sin luces no hace que el botón diga Sala OFF.
- **Amplificador/Subwoofer sin acción al tocar**: el cliente ve el estado pero no puede apagarlos sueltos.
- **"Quién está conectado"**: la integración LinkPlay/WiiM expone `source`, `app_name`, `media_title`, `media_artist`, `volume_level`. El nombre del móvil Bluetooth no se expone en la integración del núcleo; no se muestra.

## Risks

- Los nombres de origen del WiiM pueden variar por firmware: el mapeo usa coincidencias por texto (`'bluetooth' in source|lower`) y cae a mostrar el valor crudo.
