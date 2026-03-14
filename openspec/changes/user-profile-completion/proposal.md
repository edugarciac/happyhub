## Why

Users who register via Google OAuth arrive with only their name and email pre-filled. Phone number is missing and required for reservation contact. Users who register via email/password may also leave optional fields blank. Currently, the "Datos personales" section in area-privada shows editable name and phone fields, but it does not clearly indicate which fields are incomplete or prompt the user to fill them in. There is no visual cue that a profile is incomplete, and no validation that critical contact information exists before allowing a reservation.

## What changes

- On first login (or whenever the profile is incomplete), the area-privada page highlights missing fields with a visual indicator and a prompt message asking the user to complete their profile
- For Google OAuth users, name and email are pre-populated from Google profile data; phone must be entered manually
- For email/password users, all registration data (name, email, phone) is pre-populated from what they entered during registration
- Email is always read-only (already implemented)
- A "profile completeness" indicator shows which fields are filled and which need attention
- Users cannot proceed to make a reservation if their phone number is missing - they are redirected to area-privada with a message to complete their profile first

## Capabilities

### New capabilities
- `profile-completion`: Profile completeness checking, visual indicators for missing fields, and reservation gating based on complete contact information

### Modified capabilities
- Area-privada page: add profile completeness banner and field highlighting
- Booking flow: add pre-booking profile check that redirects to area-privada if phone is missing
- User profile API: return a `profileComplete` flag indicating whether all required fields are filled

## Impact

- **Frontend (area-privada.tsx)**: Add a "Completa tu perfil" banner when phone is missing. Highlight empty required fields with a visual indicator (border color, icon). Show pre-populated values from registration or Google profile
- **Frontend (booking flow)**: Before entering the booking flow, check if the user's profile has a phone number. If not, redirect to area-privada with a query param `?completeProfile=1` and show an informational message
- **API (GET /api/user/profile)**: Add `profileComplete: boolean` to the response, calculated as `name && phone` both being non-empty
- **Database**: No schema changes needed (name and phone columns already exist on the users table)
- **Auth callbacks**: For Google OAuth users, ensure the Google profile name is stored in the DB on first sign-in (already implemented). Phone remains empty and must be entered manually
