## 1. Analytics utility

- [x] 1.1 Create `src/lib/analytics.ts` with `GA_MEASUREMENT_ID`, `pageview(url)`, and `event(action, params)` functions
- [x] 1.2 All functions are no-ops when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is not set

## 2. Script loading

- [x] 2.1 Add gtag.js `<Script>` tags in `_app.tsx` using Next.js Script component with `afterInteractive` strategy
- [x] 2.2 Initialize gtag with the measurement ID and default config

## 3. Page view tracking

- [x] 3.1 Add `router.events` listener in `_app.tsx` to call `pageview()` on `routeChangeComplete`

## 4. Custom event tracking

- [x] 4.1 Add `sign_up` event tracking in the registration page after successful registration
- [x] 4.2 Add `login` event tracking in the login page after successful login
- [x] 4.3 Add `contact_form_submit` event tracking in the contact page
- [x] 4.4 Add `booking_step` event tracking in the booking wizard steps

## 5. Environment configuration

- [x] 5.1 Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to `.env.example` with documentation
- [x] 5.2 Build and verify no errors when GA ID is not set (dev mode)
