## Context

Los modales admin usan `<div className="fixed inset-0 ..." onClick={close}>` con un panel interior que hace `stopPropagation`. Un `click` se dispara sobre el ancestro común más cercano de `mousedown` y `mouseup`; si se empieza a seleccionar texto dentro de un input y se suelta sobre el fondo, ese ancestro es el backdrop → se cierra el modal.

## Goals / Non-Goals

**Goals:** que el modal no se cierre por arrastres que empiezan dentro del panel; mantener el cierre por clic real en el fondo, botón X y Cancelar.

**Non-Goals:** confirmación de "cambios sin guardar", cierre con Escape, refactor a un componente `<Modal>` común.

## Decisions

1. **Hook con ref compartido**: `useBackdropClose()` devuelve `(onClose) => ({ onMouseDown, onClick })`. `onMouseDown` recuerda si el inicio fue sobre el propio backdrop (`e.target === e.currentTarget`); `onClick` solo cierra si ambos lo fueron. Un único ref por página basta porque solo hay una interacción de puntero a la vez.
2. Se mantiene el `stopPropagation` del panel interior (inofensivo, y evita cambiar más líneas).
