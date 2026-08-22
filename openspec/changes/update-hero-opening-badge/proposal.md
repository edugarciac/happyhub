## Why

La apertura del local se ha retrasado de julio a septiembre de 2026 (obra de reforma en curso, C/ Rovellat 27, Esplugues de Llobregat). El badge de la home sigue anunciando "Apertura Julio 2026", una fecha ya incorrecta que puede generar expectativas erróneas en visitantes y llevar a reservas o consultas para una fecha que no se va a cumplir.

## What Changes

- Actualizar el texto del badge superior del Hero de "Espacio disponible · Apertura Julio 2026" a "Abrimos a partir de Septiembre de 2026"
- Cambiar el estilo del badge de translúcido/discreto (`bg-white/10`) a un fondo sólido de color llamativo (naranja) para que destaque más sobre el vídeo de fondo

## Capabilities

### Modified Capabilities

- `hero-opening-badge`: El badge de estado de apertura en la home debe mostrar la fecha de apertura correcta con alta visibilidad

## Impact

- **Frontend**: `src/components/Hero.tsx` — solo el badge de apertura (líneas ~39-42), sin tocar el resto del Hero
- No hay cambios de backend, DB ni APIs
