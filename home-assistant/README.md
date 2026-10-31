# Home Assistant de la sala

YAML versionado del panel `panel-clientes` y lo que necesita. **No se despliega solo**: hay que pegarlo en Home Assistant. Antes, haz una copia de seguridad (Ajustes > Sistema > Copias de seguridad).

Usa tarjetas de HACS ya instaladas en la tablet: **mushroom**, **card-mod**, **mini-media-player** y **kiosk-mode**.

## Orden de instalación

| # | Fichero | Dónde va |
|---|---|---|
| 1 | `packages/sala_audio.yaml` | `/config/packages/sala_audio.yaml`. Requiere en `configuration.yaml`: `homeassistant: packages: !include_dir_named packages`. Después: Herramientas de desarrollador > YAML > Comprobar configuración > Reiniciar. Comprueba que existen `sensor.estado_sala`, `sensor.estado_sonido_sala` y `sensor.conexion_musica_sala`. |
| 2 | `scripts/encender_musica.yaml` | Scripts > + Añadir script > ⋮ > Editar en YAML > pegar > Guardar. Comprueba que el id es `script.encender_musica`. |
| 3 | `scripts/encender_sala.yaml` | Scripts > *Activar sala* > ⋮ > Editar en YAML > sustituir todo > Guardar (el id sigue siendo `script.encender_sala`). |
| 4 | `dashboard/panel-clientes.yaml` | Dashboard *panel-clientes* > ✏️ > ⋮ > Editor de configuración en bruto > sustituir todo > Guardar. |

Si cambias algo en HA, vuelve a copiarlo aquí para que GitHub tenga siempre la versión de la tablet.

## Probar

1. Con todo apagado: **Sala ON** arriba y **Música ON** en el grupo Música.
2. Pulsa **Música ON** varias veces seguidas: solo arranca una vez; el botón pasa a «Encendiendo música…» (parpadea) y luego «Sonido listo». Las luces no se encienden.
3. Pulsa **Sala ON**: «Encendiendo sala… El sonido tardará unos segundos» y luego **Sala OFF**.
4. Conecta un móvil por Bluetooth y pon música: «Móvil conectado» con canción y volumen.
5. Pon una lista de la Gramola: muestra la fuente, la canción y el volumen.
6. **Sala OFF**: todo apagado, vuelve **Sala ON** y **Música ON**.

Si sale un origen raro, mira el atributo `source` de `media_player.wiim_amp_happyhub` en Herramientas de desarrollador > Estados y ajusta el mapeo de `sensor.conexion_musica_sala`.
