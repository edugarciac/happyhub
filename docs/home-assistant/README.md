# Home Assistant de la sala

Configuración del panel de la tablet (`panel-clientes`) y de los scripts de los botones. Si cambias algo en Home Assistant, actualiza también estos ficheros y la guía (`content/kb/`), que explica qué hace cada botón.

| Fichero | Dónde se pega |
|---|---|
| `panel-clientes.yaml` | Ajustes → Paneles → panel-clientes → ✏️ Editar → ⋮ → Editor de configuración en bruto |
| `encender_sala.yaml` | Ajustes → Automatizaciones y escenas → Scripts → Encender sala → ⋮ → Editar en YAML |
| `cerrar_sala.yaml` | Ajustes → Automatizaciones y escenas → Scripts → Cerrar sala → ⋮ → Editar en YAML |
| `ayuda-boton.yaml`, `ayuda-vista.yaml` | Solo si quieres añadir la Ayuda a mano a otro panel (ya están en `panel-clientes.yaml`) |

## Orden

1. En la tablet, abre `https://www.happyhub.es/guia-sala/panel`: debe verse la guía.
2. HACS → Frontend: instala **Mushroom**, **card-mod**, **Mini Media Player** y **Kiosk Mode**, y recarga el navegador.
3. Pega `panel-clientes.yaml`. La URL del panel tiene que ser `panel-clientes`.
4. Pega `encender_sala.yaml` y `cerrar_sala.yaml` (ahora encienden y apagan también la Barra).
5. En la tablet: **Activar** → se enciende todo, Barra incluida; **Ayuda** → guía con el chat abierto; **Volver al panel**; **Desactivar** → se apaga todo.

## Si Ayuda sale en blanco

La web solo deja mostrar la guía dentro de `http://homeassistant.local` o `https://homeassistant.local`, **sin puerto** (`frame-ancestors` en `next.config.js`). Si la tablet abre Home Assistant con otra dirección (`:8123`, una IP, Nabu Casa), hay que añadirla allí.
