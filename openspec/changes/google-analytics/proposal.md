## Why

HappyHub has no visibility into user traffic or behavior. We need to know who visits the site, which pages they view, how far they get in the booking funnel, and where they drop off. Google Analytics 4 (GA4) provides this for free with minimal integration effort.

## What Changes

- Add the GA4 gtag.js snippet to every page via `_document.tsx`
- Track page views automatically on every route change (SPA navigation)
- Track key events: booking funnel steps, registration, login, contact form submission
- The GA4 Measurement ID is configured via an environment variable (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) so it can differ between dev/prod
- Respect user privacy: only load GA when the measurement ID is set (disabled in dev by default)

## Capabilities

### New Capabilities
- `analytics-tracking`: Google Analytics 4 integration with page view tracking, SPA route change handling, and custom event tracking for key user actions (booking steps, registration, login, contact)

### Modified Capabilities

## Impact

- **Frontend**: `_document.tsx` (gtag script tag), `_app.tsx` (route change listener), new `src/lib/analytics.ts` utility
- **Environment**: New `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var (must be set in AWS Amplify Console for production)
- **Privacy**: GA4 anonymizes IP by default; no additional cookie consent needed for basic analytics in Spain (legitimate interest basis), but consider adding a cookie banner in a future iteration
