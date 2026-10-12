## Context

La lista "¿Qué incluye el precio?" es la constante `INCLUDED` en `PricingTable.tsx` y no aparece en ningún otro sitio.

## Goals / Non-Goals

**Goals:** mostrar la cafetera Dolce Gusto como incluida en el precio.

**Non-Goals:** incluir cápsulas ni cambiar precios.

## Decisions

1. Se añade como un elemento más de `INCLUDED`, junto a "Microondas y nevera", con el texto "Cafetera Dolce Gusto (cápsulas no incluidas)".
2. La aclaración va en el mismo elemento para que nadie asuma que las cápsulas están incluidas.

## Risks / Trade-offs

- [Riesgo] Clientes pueden asumir que las cápsulas están incluidas → Mitigado indicándolo explícitamente en el texto.
