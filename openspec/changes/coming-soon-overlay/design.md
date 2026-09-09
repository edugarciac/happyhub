## Decisions

1. **`sessionStorage` en vez de `localStorage` o cookie**: se quiere que el aviso reaparezca en cada sesión de navegador nueva (el sitio sigue en fase "casi listos" y conviene recordarlo cada vez que alguien vuelve a entrar de cero), pero no interrumpir la navegación dentro de la misma visita tras cerrarlo una vez. `localStorage` sería demasiado persistente (no volvería a verse nunca en ese navegador); una cookie no aporta nada aquí porque no hay necesidad de compartirlo con el backend.
2. **No se monta en `/admin`**: `AppContent` ya retorna antes del layout público cuando `isAdminPage` es `true` (`src/pages/_app.tsx:36-38`). El overlay se añade solo en el `return` público, para no interferir con el equipo usando el panel de administración.
3. **Número de WhatsApp real, no placeholder**: el snippet de partida traía `https://wa.me/34XXXXXXXXX`; se sustituye por `CONTACT_INFO.whatsapp` (`src/config/contact.ts`, ya usado en `Hero.tsx` y `FeedbackWidget`) para no publicar un número inválido, añadiendo el mismo `text` de query param sobre querer saber cuándo abre HappyHub.
4. **Bloqueo de scroll del `body` mientras está visible**: se mantiene el patrón del snippet (`document.body.style.overflow = 'hidden'` en el `useEffect` ligado a `visible`), con cleanup al desmontar/cerrar, igual que otros overlays a pantalla completa del proyecto.
5. **Componente autocontenido sin props**: no requiere estado del padre; se decide visibilidad internamente vía `sessionStorage` en el primer render (client-side, `useEffect`), evitando mismatch de hidratación en SSR (el componente no renderiza nada hasta que el efecto corre en cliente).

## Risks / Trade-offs

- [Riesgo] Si `sessionStorage` no está disponible (navegación privada muy restrictiva o SSR edge cases), el `useEffect` que lo lee no lanza excepción en navegadores modernos, pero si el `setItem` fallara silenciosamente el overlay podría reaparecer en cada navegación — aceptado, es un caso raro y el peor efecto es ver el overlay más veces, no un error visible.
- [Riesgo] El overlay no se muestra en `/admin`, así que un admin explorando páginas públicas fuera de `/admin` (ej. para QA) sí lo verá igual que cualquier visitante — aceptado, es el comportamiento esperado para poder verificar la experiencia real.
