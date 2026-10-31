---
type: hub
title: Guías y manual
summary: Cómo están organizadas la guía de clientes y este manual, la regla de separación y cómo actualizarlas.
order: 2
emoji: 📚
tags: [guía, manual, documentación]
---

## ¿Qué diferencia hay entre la guía y el manual?

| | Guía de clientes | Manual interno |
|---|---|---|
| Carpeta | `content/kb/` | `content/interno/` |
| Dónde se ve | [/guia-sala](/guia-sala), [/como-funciona](/como-funciona), botón Ayuda de la tablet y chatbot | Solo `/admin/manual`, con sesión de admin |
| Qué contiene | Lo que el cliente necesita para usar la sala | Cómo funciona por dentro y cómo operar el negocio |

## ¿Cómo se garantiza que un cliente nunca ve el manual?

- Son carpetas distintas y la web pública y el chatbot solo leen `content/kb/`.
- Si un texto de la guía pública contiene algo interno (entidades como `switch.` o `script.`, rutas `/admin/`, `homeassistant.local`), **la web no se publica**: el despliegue falla diciendo el fichero.
- Un documento del manual no puede declarar `pages`, así que no puede aparecer en ninguna página pública.

## ¿Cómo están organizados?

En los dos, por temas:

- **Tema** (`type: hub`): resumen en una línea (`summary`) y enlaces a sus subpáginas.
- **Explicación** (`type: detalle`): cómo funciona algo, con `parent` al tema.
- **Operación** (`type: operacion`): pasos para hacer algo, en `operaciones/`, con `parent` al tema.

## ¿Cuándo hay que actualizarlos?

**Siempre que cambie el comportamiento o el uso** de la web o de Home Assistant: en el mismo cambio se actualizan la guía de clientes y este manual.

- [Actualizar la guía de la sala](../operaciones/actualizar-guia.md)
- [Dar acceso al manual a un familiar](../operaciones/dar-acceso-al-manual.md)
