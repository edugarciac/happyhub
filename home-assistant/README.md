# Home Assistant de la sala

YAML versionado del panel `panel-clientes` y lo que necesita. **No se despliega solo**: hay que pegarlo en Home Assistant. Antes, haz una copia de seguridad (Ajustes > Sistema > Copias de seguridad).

Usa tarjetas de HACS ya instaladas en la tablet: **mushroom**, **card-mod**, **mini-media-player** y **kiosk-mode**.

## Orden de instalación

Casi todo se crea **desde la interfaz** de Home Assistant. La excepción son los comandos directos al WiiM: el contenido de `configuration-wiim.yaml` se pega en `configuration.yaml` y hay que reiniciar la primera vez. Reserva en el router la IP del WiiM que aparece en ese fichero. En GitHub, el icono **Copy raw file** copia el fichero entero.

| # | Qué | Cómo |
|---|---|---|
| 1 | Comprobar el Chromecast | Herramientas para desarrolladores > Estados > busca «proyector». Debe ser `media_player.proyector`; si no, cambia el id en `helpers/sensor.estado_proyector.jinja` y `scripts/proyector_poner_fondo.yaml` antes de pegarlos. |
| 2 | 4 sensores de plantilla | Ajustes > Dispositivos y servicios > Ayudantes > + Crear ayudante > Plantilla > **Sensor de plantilla**. Uno por fichero de `helpers/sensor.*.jinja`: el nombre que indica su cabecera y, como plantilla de estado, el fichero entero. |
| 3 | Desplegable del fondo | Ayudantes > + Crear ayudante > **Desplegable**, según `helpers/input_select.fondo_proyector.md`. |
| 4 | Fondos del proyector | Multimedia > Mis multimedia > carpetas `happyhub` > `proyector` > sube `happyhub.jpg` y `happyhub.mp4`. |
| 5 | URL con IP | Ajustes > Sistema > Red > URL local: `http://<IP de HA>`, con el puerto que use Home Assistant (en la sala, el 80). El Chromecast no resuelve `homeassistant.local`. |
| 6 | Scripts | Scripts > + Añadir script > ⋮ > Editar en YAML: `encender_musica`, `apagar_musica` y `proyector_poner_fondo` (nuevos). `encender_sala`, `cerrar_sala` y `liberar_bluetooth` **sustituyen** a los existentes (ábrelos > ⋮ > Editar en YAML). Comprueba que los ids coinciden con el nombre del fichero. |
| 7 | Automatización | Automatizaciones > + Crear automatización > Crear nueva > ⋮ > Editar en YAML: `automations/proyector_fondo_auto.yaml` y `automations/wiim_volumen_inicial.yaml`. |
| 8 | Dashboard | *panel-clientes* > ✏️ > ⋮ > Editor de configuración en bruto > sustituir todo por `dashboard/panel-clientes.yaml`. |

Si cambias algo en HA, vuelve a copiarlo aquí para que GitHub tenga siempre la versión de la tablet.

## Probar

1. Con todo apagado: **Encender sala** arriba y **Encender música** en el grupo Música. No aparecen tarjetas de Amplificador, Subwoofer ni Gramola.
2. Pulsa **Encender música**: en unos 3 s pasa a «Música encendida», con **Apagar música** y **Liberar Bluetooth**. Las luces no se encienden.
3. El volumen queda en el 25 % en cuanto el WiiM responde (alrededor de un minuto).
4. Conecta un móvil por Bluetooth y pon música. Pulsa **Liberar Bluetooth**: el móvil se desconecta y puedes conectar otro.
5. **Apagar música** pide confirmación y apaga el sonido sin tocar las luces.
6. **Encender sala**: «Encendiendo sala…» y luego **Apagar sala**.
7. **Apagar sala**: todo apagado, incluida la Barra, y vuelve **Encender sala**.
8. **Proyector**: enciéndelo con el mando: «Proyector listo» y a los 10 s sale el fondo elegido («Mostrando fondo HappyHub»).
9. Envía un vídeo de YouTube desde un móvil a «Proyector»: «Proyectando · YouTube». Al pararlo, a los 10 s vuelve el fondo.
10. Cambia el fondo en el panel mientras se proyecta: no debe interrumpir. Prueba también que el vídeo de fondo se repite al terminar.
