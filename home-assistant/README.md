# Home Assistant de la sala

YAML versionado del panel `panel-clientes` y lo que necesita. **No se despliega solo**: hay que pegarlo en Home Assistant. Antes, haz una copia de seguridad (Ajustes > Sistema > Copias de seguridad).

Usa tarjetas de HACS ya instaladas en la tablet: **mushroom**, **card-mod**, **mini-media-player** y **kiosk-mode**.

## Orden de instalación

| # | Fichero | Dónde va |
|---|---|---|
| 1 | `packages/sala_audio.yaml` | `/config/packages/sala_audio.yaml`. Requiere en `configuration.yaml`: `homeassistant: packages: !include_dir_named packages`. Después: Herramientas de desarrollador > YAML > Comprobar configuración > Reiniciar. Comprueba que existen `sensor.estado_sala`, `sensor.estado_sonido_sala` y `sensor.conexion_musica_sala`. |
| 1b | `packages/sala_proyector.yaml` | `/config/packages/sala_proyector.yaml` (proyector). Antes: comprueba que el Chromecast es `media_player.proyector` (si no, cambia el id en el fichero); sube los fondos a `/media/happyhub/proyector/` (`happyhub.jpg` y `happyhub.mp4`, en Ajustes > Multimedia o por Samba); en Ajustes > Sistema > Red pon la URL local de HA **con IP** (`http://192.168.x.x:8123`), porque el Chromecast no resuelve `homeassistant.local`. Reinicia. |
| 2 | `scripts/encender_musica.yaml` | Scripts > + Añadir script > ⋮ > Editar en YAML > pegar > Guardar. Comprueba que el id es `script.encender_musica`. |
| 3 | `scripts/encender_sala.yaml` | Scripts > *Activar sala* > ⋮ > Editar en YAML > sustituir todo > Guardar (el id sigue siendo `script.encender_sala`). |
| 4 | `dashboard/panel-clientes.yaml` | Dashboard *panel-clientes* > ✏️ > ⋮ > Editor de configuración en bruto > sustituir todo > Guardar. |

Si cambias algo en HA, vuelve a copiarlo aquí para que GitHub tenga siempre la versión de la tablet.

## Probar

1. Con todo apagado: **Sala ON** arriba y **Música ON** en el grupo Música.
2. Pulsa **Música ON** varias veces seguidas: solo arranca una vez; el botón pasa a «Encendiendo música…» (parpadea) y luego «Sonido listo». Las luces no se encienden.
3. Pulsa **Sala ON**: «Encendiendo sala… El sonido tardará unos segundos» y luego **Sala OFF**.
4. Conecta un móvil por Bluetooth y pon música: «Móvil conectado» con canción y volumen.
5. La **Gramola** sale en gris con «Próximamente» y no hace nada al pulsarla.
6. **Sala OFF**: todo apagado, vuelve **Sala ON** y **Música ON**.
7. **Proyector**: con el proyector apagado, «Proyector apagado». Enciéndelo con el mando: «Proyector listo» y a los 10 s sale el fondo elegido («Mostrando fondo HappyHub»).
8. Envía un vídeo de YouTube desde un móvil a «Proyector»: «Proyectando · YouTube». Al pararlo, a los 10 s vuelve el fondo.
9. Cambia el fondo en el panel mientras se proyecta: no debe interrumpir. Prueba también que el vídeo de fondo se repite al terminar.

Si sale un origen raro, mira el atributo `source` de `media_player.wiim_amp_happyhub` en Herramientas de desarrollador > Estados y ajusta el mapeo de `sensor.conexion_musica_sala`.
