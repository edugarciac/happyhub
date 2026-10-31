# Manual interno de HappyHub

Manual **interno**: operaciones y explicaciones del negocio para la familia. **Solo lo ven los administradores** en `/admin/manual`; nunca se publica en la web ni lo usa el chatbot de clientes. Los documentos de aquí no pueden tener `pages` (el build falla).

Mismo formato que la guía pública (`content/kb/README.md`):

- `type: operacion` para una tarea concreta, con `when` y las secciones `## Para qué sirve`, `## Cuándo usarla`, `## Pasos`, `## Qué hace`, `## Si algo falla`.
- `type: hub` para un tema (obligatorio `summary`), `type: detalle` para una explicación; un `## ` por pregunta.
- Organización por temas, con `parent` para anidar:
  - `sala/home-assistant.md` (tema) → `sala/panel-de-la-tablet.md`, `sala/scripts.md`, `sala/entidades.md` y sus operaciones.
  - `guias/guias-y-manual.md` (tema) → `operaciones/actualizar-guia.md`, `operaciones/dar-acceso-al-manual.md`.
  - Todas las operaciones en `operaciones/`, con `parent` al tema.
- La portada `/admin/manual` muestra los temas (sin `parent`) y todas las operaciones.
- Enlaces entre documentos con ruta relativa al `.md`. Para enlazar a la guía pública, usar la ruta de la web (`/guia-sala/...`).

**No guardes aquí contraseñas, tokens ni códigos de acceso**: el manual vive en el repositorio de GitHub.

Este fichero (`README.md`) no se publica.
