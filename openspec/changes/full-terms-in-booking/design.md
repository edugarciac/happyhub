## Decisions

1. **Términos dentro del formulario**, no en otra página: obligar a abrir otra página haría perder el formulario rellenado y no garantiza que se lea. Con el recuadro integrado, la lectura forma parte del flujo.
2. **Activación por scroll al final** (con 24 px de margen). Si el cliente vuelve al paso 3 tras haberlos aceptado, la casilla sigue activa.
3. **Una sola fuente del texto** (`TermsContent`): la página y el formulario no pueden volver a divergir.
4. Estilos compactos en el recuadro con variantes de Tailwind (`[&_h2]:text-base`…) sin tocar el componente.
