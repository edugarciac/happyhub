## 1. Allowlist helper

- [x] 1.1 Crear `src/utils/bookingAccess.ts` con `getBookingAllowedEmails()` e `isBookingAllowedEmail(email)`, leyendo `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS`
- [x] 1.2 Añadir `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS` a `.env.example`

## 2. Header CTA

- [x] 2.1 Calcular `canRequestReservation` con `isBookingAllowedEmail(session?.user?.email)` en `Header.tsx`
- [x] 2.2 Sustituir el `Link` a `/reservas` (desktop) por versión deshabilitada cuando `canRequestReservation` es `false`
- [x] 2.3 Igual para la versión del menú móvil

## 3. Gate de `/reservas`

- [x] 3.1 Crear página `src/pages/reserva-restringida.tsx` (mensaje informativo, estilo consistente con `verificacion-pendiente.tsx`)
- [x] 3.2 Ampliar el `useEffect` de `reservas.tsx`: redirigir a `/login` si no hay sesión, a `/reserva-restringida` si el email no está en la allowlist
- [x] 3.3 No renderizar `BookingWizard` mientras la sesión está `loading` o se está redirigiendo

## 4. Verificación

- [x] 4.1 `npm run build` / typecheck sin errores
- [ ] 4.2 Verificación manual: sin sesión, sesión no autorizada, sesión autorizada (pendiente de configurar `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS` real en el entorno de pruebas)
