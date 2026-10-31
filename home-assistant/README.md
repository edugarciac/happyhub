# Home Assistant de la sala

YAML versionado del panel `panel-clientes` y lo que necesita. **No se despliega solo**: hay que pegarlo en Home Assistant. Antes, haz una copia de seguridad (Ajustes > Sistema > Copias de seguridad).

Usa tarjetas de HACS ya instaladas en la tablet: **mushroom**, **card-mod**, **mini-media-player** y **kiosk-mode**.

## Orden de instalación

Todo se crea **desde la interfaz** de Home Assistant: no hace falta tocar `configuration.yaml` ni reiniciar. En GitHub, el icono **Copy raw file** copia el fichero entero.

| # | Qué | Cómo |
|---|---|---|
| 1 | Comprobar el Chromecast | Herramientas para desarrolladores > Estados > busca «proyector». Debe ser `media_player.proyector`; si no, cambia el id en `helpers/sensor.estado_proyector.jinja` y `scripts/proyector_poner_fondo.yaml` antes de pegarlos. |
| 2 | 4 sensores de plantilla | Ajustes > Dispositivos y servicios > Ayudantes > + Crear ayudante > Plantilla > **Sensor de plantilla**. Uno por fichero de `helpers/sensor.*.jinja`: el nombre que indica su cabecera y, como plantilla de estado, el fichero entero. |
| 3 | Desplegable del fondo | Ayudantes > + Crear ayudante > **Desplegable**, según `helpers/input_select.fondo_proyector.md`. |
| 4 | Fondos del proyector | Multimedia > Mis multimedia > carpetas `happyhub` > `proyector` > sube `happyhub.jpg` y `happyhub.mp4`. |
| 5 | URL con IP | Ajustes > Sistema > Red > URL local: `http://<IP de HA>:8123`. El Chromecast no resuelve `homeassistant.local`. |
| 6 | Scripts | Scripts > + Añadir script > ⋮ > Editar en YAML: `scripts/encender_musica.yaml` y `scripts/proyector_poner_fondo.yaml` (nuevos). `scripts/encender_sala.yaml` **sustituye** al script *Activar sala* (abre el existente > ⋮ > Editar en YAML). Comprueba los ids: `script.encender_musica`, `script.proyector_poner_fondo`, `script.encender_sala`. |
| 7 | Automatización | Automatizaciones > + Crear automatización > Crear nueva > ⋮ > Editar en YAML: `automations/proyector_fondo_auto.yaml`. |
| 8 | Dashboard | *panel-clientes* > ✏️ > ⋮ > Editor de configuración en bruto > sustituir todo por `dashboard/panel-clientes.yaml`. |

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
