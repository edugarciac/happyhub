## Context

`src/components/Hero.tsx` renderiza un badge pill en la parte superior del contenido del Hero, sobre el vídeo de fondo. Actualmente usa un fondo translúcido (`bg-white/10 backdrop-blur-sm`) con texto blanco tenue (`text-white/90`), pensado para integrarse discretamente con el vídeo. El texto dice "Espacio disponible · Apertura Julio 2026", que ya no es correcto.

## Goals / Non-Goals

**Goals:**
- Reflejar la fecha de apertura correcta (septiembre 2026)
- Aumentar el contraste/protagonismo visual del badge para que se note el cambio de estado del negocio

**Non-Goals:**
- Rediseñar el resto del Hero (H1, CTAs, tarjeta flotante de WhatsApp)
- Añadir la paleta `orange` completa propuesta en `homepage-redesign` — se usa el naranja por defecto de Tailwind (ya disponible sin tocar `tailwind.config.js`, como ya se usa `amber-400` en el mismo componente)

## Decisions

1. **Color llamativo**: fondo sólido `bg-orange-500` con texto blanco y borde `border-orange-300`, en vez de translúcido. Es un color por defecto de Tailwind, no requiere cambios en `tailwind.config.js`.
2. **Punto pulsante**: se mantiene el `animate-pulse`, pero en blanco para contrastar sobre el fondo naranja sólido (antes era `bg-primary-400` sobre fondo translúcido).
3. **Texto**: "Abrimos a partir de Septiembre de 2026" (sin "Espacio disponible", ya que el mensaje ahora es sobre la fecha, no sobre disponibilidad).

## Risks / Trade-offs

- [Riesgo] Un naranja sólido puede chocar con la paleta teal (`primary`) del resto del sitio → Aceptado: es un cambio deliberadamente temporal y llamativo (badge de "coming soon"), no forma parte de la identidad visual permanente.
