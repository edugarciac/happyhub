# Bug Log

Track bugs, issues, and their solutions for quick reference in future sessions.

## Recent Bugs

### 2026-02-24 - NextAuth Build Failure on AWS Amplify
- **Issue**: Build fails with "TypeError: Invalid URL" when NextAuth tries to parse empty NEXTAUTH_URL
- **Root Cause**: NEXTAUTH_URL environment variable not configured in AWS Amplify Console
- **Solution**:
  - Add NEXTAUTH_URL to Amplify environment variables with production URL
  - Added NEXTAUTH_URL to next.config.js env object for build-time access
- **Prevention**: Verify all required env vars in Amplify Console before deployment
- **Files Changed**: next.config.js (added NEXTAUTH_URL to env)

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

### n8n Connection Blocked by Zscaler (2026-02-22)
- **Issue**: n8n instance not accessible, timeouts and 504 Gateway errors
- **Root Cause**: Corporate firewall (Zscaler) blocks connections to EC2 IP
- **Solution**:
  - Access n8n directly when not on corporate network
  - Or configure VPN/proxy to bypass Zscaler
  - Security group rules updated (ports 80, 5678 open)
- **Prevention**: Be aware that Easypanel/n8n may be blocked on corporate networks
- **Workaround**: Use mobile hotspot or home network for n8n configuration

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
