## Why

La galería de la portada ("Conoce Nuestro Espacio") usaba 5 fotos generadas (globos, brindis, fiesta nocturna) que no muestran el local real. Con la inauguración el 16 de octubre, las familias tienen que ver el espacio de verdad.

## What Changes

- Sustituir las 5 fotos generadas (`public/images/gallery/gallery-1..5.jpg`) por 8 fotos reales del local: sala con barra, sala principal, parque infantil con futbolín, zona chill, lavabos y baño adaptado con cambiador
- `PhotoGallery`: soporte de fotos verticales (`portrait`), que se muestran enteras sobre un fondo desenfocado en lugar de recortarse al formato 16:9
- Miniaturas con `loading="lazy"`

## Capabilities

### Modified Capabilities

- `home-gallery`: muestra fotos reales del local

## Impact

- `src/pages/index.tsx`, `src/components/PhotoGallery.tsx`, `public/images/gallery/`
- Fotos sin metadatos (EXIF/GPS eliminados), JPEG calidad 82, entre 310 y 650 KB cada una
