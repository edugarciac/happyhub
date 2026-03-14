## Tasks

### Backend
- [ ] T1: Add `profileComplete` field to `GET /api/user/profile` response (calculated from name + phone)

### Frontend - area-privada
- [ ] T2: Add incomplete profile banner component (amber, dismisses on save)
- [ ] T3: Add amber border highlighting on empty required fields (name, phone)
- [ ] T4: Handle `?completeProfile=1` query param to show informational message
- [ ] T5: After successful profile save, re-fetch profile and remove banner/highlights if complete

### Frontend - booking flow
- [ ] T6: Add profile completeness check before booking (fetch `/api/user/profile`, check `profileComplete`)
- [ ] T7: Redirect authenticated users with incomplete profile to `/area-privada?completeProfile=1`

### Testing
- [ ] T8: Verify Google OAuth user sees empty phone field with highlight after first login
- [ ] T9: Verify email/password user with all fields filled sees no banner
- [ ] T10: Verify booking redirect works for incomplete profiles and does not block unauthenticated users
