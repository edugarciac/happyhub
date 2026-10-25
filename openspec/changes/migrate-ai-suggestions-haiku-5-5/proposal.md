## Why

Las sugerencias de regalo y de actividades de `/mis-eventos` usan Claude Haiku 4.5 (`generateText` en `src/lib/ai.ts`). Claude Haiku 5.5 es más nuevo, sigue mejor las instrucciones y cuesta unas 10 veces menos por token (0,10 $ / 0,50 $ por millón frente a 1 $ / 5 $). El chatbot ya usa Haiku 5.5.

## What Changes

- `generateText` pasa a `claude-haiku-5-5` con `effort: low`.
- Lee la respuesta por tipo de bloque (Haiku 5.5 razona antes de responder y la respuesta puede empezar por un bloque de razonamiento).
- `max_tokens` de 1 024 a 8 000: el razonamiento cuenta en el límite y el tokenizador nuevo usa ~30% más tokens para el mismo texto.
- Errores claros si el modelo rechaza la petición o la respuesta se corta.

## Capabilities

### Modified Capabilities

- `ai-suggestions`: modelo de las sugerencias de regalo y actividades

## Impact

- `src/lib/ai.ts` (usado por `regalo/suggest` y `entertainment/activities/suggest`); sin cambios en los prompts ni en las APIs.
