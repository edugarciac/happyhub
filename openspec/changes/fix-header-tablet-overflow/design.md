## Decisions

- **Breakpoint `xl`**: medido con Playwright, la barra sin sesión necesita ~1115px de viewport; con avatar compacto queda por debajo de 1280px. Los iPad (hasta 1194px en horizontal, 1366px el Pro 12.9") usan hamburguesa salvo el Pro 12.9", que cabe.
- **Avatar con inicial** en lugar del email: ahorra ~180px y sigue indicando que hay sesión. Alternativa descartada: truncar más el email → sigue ocupando sitio y se lee peor.
