## Context

El dashboard `panel-clientes` y los scripts viven en Home Assistant, no en este repo. Se versiona aquí el YAML para pegarlo en HA.

## Decisions

- **Solo tarjetas del núcleo de HA** (conditional, button, tile, markdown): no depende de HACS.
- **Estado derivado en un sensor plantilla** (`sensor.estado_sonido_sala`: `apagado` / `arrancando` / `listo` / `incompleto`) para que todas las tarjetas lean una sola fuente.
  - `arrancando` = `script.encender_sala` en marcha.
  - `listo` = amplificador ON + subwoofer ON + WiiM disponible.
  - `incompleto` = cualquier mezcla (p. ej. subwoofer apagado): se muestra **Activar SALA** y **Desactivar SALA** para poder arreglarlo.
- **El script espera al WiiM** (`wait_template`, timeout 60 s, continúa si vence) en vez de un delay fijo.
- **Amplificador/Subwoofer sin acción al tocar**: el cliente ve el estado pero no puede apagarlos sueltos.
- **"Quién está conectado"**: la integración LinkPlay/WiiM expone `source`, `app_name`, `media_title`, `media_artist`, `volume_level`. El nombre del móvil Bluetooth no se expone en la integración del núcleo; la tarjeta lo muestra solo si existe algún atributo con él.

## Risks

- Los nombres de origen del WiiM pueden variar por firmware: el mapeo usa coincidencias por texto (`'bluetooth' in source|lower`) y cae a mostrar el valor crudo.
