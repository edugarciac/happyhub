## Why

La sala tiene un proyector con un Chromecast llamado «Proyector». El panel de la tablet no dice si está encendido ni si hay algo proyectándose, y cuando no se proyecta nada se ve el fondo genérico del Chromecast en vez de la imagen de HappyHub.

## What Changes

- Nuevo grupo **Proyector** en el panel con el estado:
  - **Apagado**: el Chromecast no responde → «Enciéndelo con el mando».
  - **Listo**: Chromecast disponible sin contenido → «Envía contenido desde tu móvil a "Proyector"».
  - **Fondo HappyHub**: mostrando el fondo elegido.
  - **Proyectando**: app / título de lo que se envía.
- **Fondo cuando no se proyecta nada**, a elegir por el cliente en el panel: imagen HappyHub, vídeo HappyHub o fondo del Chromecast. Una automatización lo pone a los pocos segundos de quedar libre; nunca interrumpe lo que un cliente esté enviando.
- Encendido: de momento con el **mando a distancia** (a futuro, emisor IR).
- Guías de usuario (nueva operación «Usar el proyector», panel, Sala OFF) e interna (explicación del proyector, entidades, operación para cambiar los fondos).

## Capabilities

### Modified Capabilities

- `sala-panel`: estado del proyector y fondo por defecto

## Impact

- Nuevo `home-assistant/packages/sala_proyector.yaml`; `home-assistant/dashboard/panel-clientes.yaml`; `home-assistant/README.md`
- `content/kb/**`, `content/interno/**`
