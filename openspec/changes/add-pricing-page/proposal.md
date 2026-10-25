## Why

Los precios solo aparecen en una sección de la home. Es una de las primeras dudas de cualquier cliente y no hay forma directa de llegar a ella desde el menú ni un enlace que compartir.

## What Changes

- Nueva página `/precios` que reutiliza `PricingTable` (precios desde `/api/pricing/current`, sin duplicar cifras)
- Nueva opción **"Precio"** en el menú principal (`navItems` de `src/components/Header.tsx`), tras "¿Cómo lo hacemos?"

## Capabilities

### New Capabilities

- `pricing-page`: página pública de precios enlazada desde el menú

## Impact

- **Frontend**: nuevo `src/pages/precios.tsx`; `src/components/Header.tsx`
