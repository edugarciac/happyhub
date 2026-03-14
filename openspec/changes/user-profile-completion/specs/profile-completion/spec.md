## Capability: profile-completion

### Requirements

#### REQ-1: Profile completeness flag in API
- `GET /api/user/profile` must return a `profileComplete` boolean field
- `profileComplete` is `true` when both `name` (length >= 2) and `phone` (valid format) are non-empty
- `profileComplete` is `false` otherwise

#### REQ-2: Incomplete profile banner in area-privada
- When `profileComplete` is `false`, show an amber banner at the top of the "Datos personales" section
- Banner text: "Completa tu perfil para poder hacer reservas. Necesitamos tu numero de telefono para contactarte."
- Banner includes a down-arrow or visual cue pointing to the incomplete fields
- Banner disappears immediately after the user saves valid values for all required fields (no page reload needed)

#### REQ-3: Field highlighting for empty required fields
- If `name` is empty, the name input gets an amber border (`border-amber-400`) and a "Requerido" label
- If `phone` is empty, the phone input gets an amber border (`border-amber-400`) and a "Requerido" label
- Highlighting is removed once the field has a valid value and is saved

#### REQ-4: Pre-populated fields from registration or Google
- For email/password users: name, email, and phone are pre-populated from registration data (already works via `GET /api/user/profile`)
- For Google OAuth users: name and email come from Google profile (stored on first sign-in). Phone is empty and must be entered manually
- Email is always read-only (already implemented)

#### REQ-5: Booking flow gate
- Before showing the booking calendar or form, the frontend checks the user's `profileComplete` status
- If `profileComplete` is `false`, redirect to `/area-privada?completeProfile=1`
- When `completeProfile=1` query param is present, show an informational message: "Antes de reservar, necesitamos que completes tus datos de contacto"
- Once the profile is saved with valid data, the user can navigate to the booking flow normally
- Unauthenticated users can still browse the booking page (the gate only applies to authenticated users with incomplete profiles)

#### REQ-6: Phone field behavior
- Phone field accepts formats: `+34612345678`, `612345678`, `+49171234567` (international)
- Validation regex: `/^\+?[0-9]{9,15}$/` (already in place)
- Placeholder text: `+34612345678`
- On save, phone is stored as entered (no normalization)

### Out of scope
- Making phone mandatory at registration time (this would be a separate change)
- Profile photo or avatar
- Address or other personal fields beyond name, email, phone
