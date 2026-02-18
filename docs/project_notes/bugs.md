# Bug Log

Track bugs, issues, and their solutions for quick reference in future sessions.

## Recent Bugs

### 2025-01-27 - Google Calendar Timezone Issues
- **Issue**: Calendar datetime format causing timezone-related booking errors
- **Root Cause**: Missing timezone information in ISO datetime strings
- **Solution**: Added timezone to Google Calendar datetime format in API
- **Prevention**: Always include timezone context for calendar operations

### 2025-01-27 - TypeScript Type Error in booked-slots API
- **Issue**: TypeScript compilation error in booked-slots API endpoint
- **Root Cause**: Type mismatch in API response structure
- **Solution**: Fixed TypeScript type definitions to match expected response structure
- **Prevention**: Use strict TypeScript checking during development

## Known Issues to Watch For

### Stripe Webhook Signature Verification
- **Context**: `/api/stripe-webhook` requires raw body for signature validation
- **Critical**: Must keep `bodyParser: false` in API config
- **What breaks**: If Next.js body parsing is enabled, signatures will fail
- **Reference**: Uses `micro` package's `buffer()` helper

### n8n Workflow Dependency
- **Context**: Reservation flow depends on external n8n instance
- **What breaks**: If n8n is down or webhook URL changes, reservations fail
- **Prevention**: Test webhook connectivity before major deployments
- **Monitoring**: Check `N8N_WEBHOOK_URL` environment variable

### JWT Token Expiration
- **Context**: JWT tokens stored in localStorage with no auto-refresh
- **What happens**: Users get 401 errors after token expires
- **Workaround**: User must log in again
- **Future**: Consider implementing refresh token flow

## Tips

- Always check this file when encountering errors
- Update immediately when fixing new bugs
- Include enough context for future debugging
- Clean out very old entries (6+ months) periodically
