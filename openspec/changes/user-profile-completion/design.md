## Design decisions

### Required fields for a "complete" profile
- **Name**: required (pre-filled from registration or Google)
- **Phone**: required (must be entered manually by Google users)
- **Email**: always present, read-only

### Profile completeness logic
The API returns `profileComplete: true` only when both `name` and `phone` are non-empty strings. This flag drives all frontend behavior (banner, booking gate).

### UX for incomplete profiles

1. **Area-privada banner**: A yellow/amber banner at the top of the "Datos personales" section with text like "Completa tu perfil para poder hacer reservas. Necesitamos tu numero de telefono para contactarte." The banner disappears once all required fields are filled.

2. **Field highlighting**: Empty required fields get an amber border and a small "Requerido" label next to the field name. Once filled and saved, the highlight disappears.

3. **Booking gate**: When a user tries to access `/reservas` or the booking flow without a complete profile, they are redirected to `/area-privada?completeProfile=1`. The query param triggers an informational toast or banner: "Antes de reservar, necesitamos que completes tus datos de contacto."

### Data flow for Google OAuth users
1. User signs in with Google
2. `signIn` callback in `auth.ts` creates user with: `name` from Google profile, `email` from Google, `phone` empty, `email_verified` true
3. User lands on area-privada (after login redirect change)
4. Profile loads: name and email are filled, phone is empty
5. Profile completeness banner shows, phone field is highlighted
6. User enters phone and saves
7. Banner disappears, user can now book

### Data flow for email/password users
1. User registers with name, email, phone, password
2. All fields are pre-populated on area-privada
3. If phone was left empty during registration (currently it's optional in the form), the same completeness banner shows
4. User fills in the missing field and saves
