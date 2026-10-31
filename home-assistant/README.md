# Home Assistant de la sala

YAML versionado del panel `panel-clientes`. **No se despliega solo**: hay que pegarlo en Home Assistant.

| Fichero | Dónde va |
|---|---|
| `packages/sala_audio.yaml` | `/config/packages/sala_audio.yaml`. Requiere en `configuration.yaml`: `homeassistant: packages: !include_dir_named packages`. Después: Herramientas de desarrollador > Comprobar configuración > Reiniciar. |
| `scripts/encender_sala.yaml` | Scripts > *Activar sala* > ⋮ > Editar en YAML > sustituir todo. |
| `dashboard/panel-clientes-audio.yaml` | Dashboard *panel-clientes* > Editar > Añadir tarjeta > Manual. Son 3 tarjetas separadas por `---`: pégalas una a una. La 1 sustituye a los botones Activar y Desactivar. |

## Probar

1. Con todo apagado: el panel muestra **Activar SALA** y «Sonido apagado».
2. Pulsa **Activar SALA**: aparece «⏳ Activando la sala… el sonido tardará unos segundos».
3. Cuando el WiiM vuelve: «🟢 Sonido listo», Amplificador y Subwoofer en verde, y **Desactivar SALA**.
4. Conecta un móvil por Bluetooth: «📱 Móvil por Bluetooth» con canción y volumen.

Si la tarjeta *Qué está sonando* muestra un origen raro, mira el atributo `source` de `media_player.wiim_amp_happyhub` en Herramientas de desarrollador > Estados y ajusta el mapeo en `sensor.conexion_musica_sala`.
