## Why

La FAQ de `/como-funciona` afirma que existe una "zona exterior habilitada para fumadores". La memoria de actividad presentada al Ajuntament declara que la actividad no tiene terraza ni ocupa la vía pública; la única zona exterior es la plaza pública. Señalarla como zona de fumadores podría interpretarse como un uso de la vía pública vinculado a la actividad.

## What Changes

- Eliminar la frase "Existe una zona exterior habilitada para fumadores." de la respuesta a "¿Se puede fumar en el espacio?" en `src/pages/como-funciona.tsx`. Se mantiene la prohibición de fumar en el interior.

## Capabilities

### Modified Capabilities

- `venue-rules-faq`: la norma sobre tabaco deja de mencionar una zona exterior.

## Impact

- Solo texto en una página pública. Sin cambios de lógica, API ni base de datos.
