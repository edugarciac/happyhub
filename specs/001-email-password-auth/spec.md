# Feature Specification: Email/Password and Google OAuth Authentication

**Feature Branch**: `001-email-password-auth`
**Created**: 2026-02-19
**Updated**: 2026-03-13
**Status**: Draft
**Input**: User description: "Add user authentication with email/password and Google OAuth. Support multiple auth methods, account linking, and seamless user experience."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration (Priority: P1)

A new customer wants to create an account on HappyHub to book events. They can choose to register using either email/password (providing email, password, name, phone) OR by signing up with their Google account (Google handles authentication, HappyHub receives basic profile information).

**Why this priority**: Registration is the entry point for all authenticated features. Offering both traditional and social login options reduces friction and increases conversion rates. Without registration, users cannot access personalized services, view reservation history, or manage bookings. This is the foundational capability that enables all other authentication-dependent features.

**Independent Test**: Can be fully tested by (1) navigating to the registration page, filling out email/password form with valid data, submitting it, and verifying account creation, OR (2) clicking "Sign up with Google" button, completing Google OAuth flow, and verifying account creation with Google profile data. Both paths deliver immediate value by allowing users to establish their identity.

**Acceptance Scenarios**:

1. **Given** a user is on the registration page, **When** they enter a valid email (not previously registered), a strong password (minimum 8 characters with letters and numbers), name, and phone number, **Then** the system creates their account and sends a confirmation email
2. **Given** a user is on the registration page, **When** they click "Sign up with Google" and complete the Google OAuth flow, **Then** the system creates their account using Google profile information (email, name) and prompts for phone number if not provided by Google
3. **Given** a user enters an email that is already registered, **When** they submit the registration form, **Then** the system displays an error message "This email is already registered. Please log in or use a different email"
4. **Given** a user tries to sign up with Google using a Google account whose email is already registered, **When** the OAuth flow completes, **Then** the system displays "An account with this email already exists. Please log in or link your Google account from your profile settings"
5. **Given** a user enters a weak password (less than 8 characters or missing required character types), **When** they attempt to register, **Then** the system displays password strength requirements and prevents registration
6. **Given** a user enters an invalid email format, **When** they submit the form, **Then** the system displays an error message "Please enter a valid email address"
7. **Given** a user successfully registers (via email/password or Google), **When** the account is created, **Then** they are automatically logged in and redirected to their dashboard

---

### User Story 2 - User Login (Priority: P1)

A registered customer wants to access their account by entering their email and password OR by clicking "Sign in with Google" if their account is linked to Google. Upon successful authentication, the site header changes to reflect the authenticated state: the user icon is replaced by the user's email address and a logout button. A new navigation item "Área privada" becomes visible, linking to the user's private area. From there, the user can view their reservations, update their profile, and access protected features.

**Why this priority**: Login is equally critical to registration as it enables returning users to access their accounts and manage their bookings. Supporting both authentication methods provides flexibility and convenience. Without login, users cannot access any of their previous reservations or personalized features. This completes the core authentication cycle.

**Independent Test**: Can be fully tested by creating a user account (via email/password or Google), then attempting to log in using the same method and verifying access to protected resources. Can also test with incorrect credentials to verify error handling.

**Acceptance Scenarios**:

1. **Given** a registered user (email/password account) is on the login page, **When** they enter their correct email and password, **Then** they are authenticated and redirected to their dashboard
2. **Given** a registered user (Google account) is on the login page, **When** they click "Sign in with Google" and complete the OAuth flow, **Then** they are authenticated and redirected to their dashboard
3. **Given** a user with a Google-linked account tries to log in with email/password, **When** they submit the login form, **Then** the system authenticates them successfully (both methods work for linked accounts)
4. **Given** a user enters an incorrect password, **When** they submit the login form, **Then** the system displays "Invalid email or password" and does not reveal which field is incorrect
5. **Given** a user enters an email that is not registered, **When** they submit the login form, **Then** the system displays "Invalid email or password" without revealing that the email is unregistered
6. **Given** a user tries to sign in with Google using an unregistered Google account, **When** the OAuth flow completes, **Then** the system displays "No account found. Please sign up first"
7. **Given** a user successfully logs in, **When** the session is established, **Then** the system stores an authentication token that persists across page navigation
8. **Given** a user has logged in on one device, **When** they log in on another device, **Then** both sessions remain active (no single-session restriction)
9. **Given** a user successfully logs in (via either method), **When** the header renders, **Then** the user icon is replaced by the user's email address (truncated if necessary) and a logout button
10. **Given** a user successfully logs in, **When** the navigation menu renders, **Then** a new menu item "Área privada" appears linking to `/area-privada`
11. **Given** an unauthenticated visitor views the site, **When** the header renders, **Then** a user icon is shown linking to the login page and the "Área privada" menu item is not visible

---

### User Story 3 - Account Linking (Priority: P2)

A logged-in user who registered with email/password wants to link their Google account for easier future logins. Conversely, a user who signed up with Google wants to set a password for alternative access. This provides flexibility and redundancy in authentication methods.

**Why this priority**: Account linking enhances user convenience and provides backup authentication options. While not critical for initial MVP, it significantly improves user experience by allowing users to choose their preferred login method at any time. This is especially valuable for users who initially chose one method but later prefer the other.

**Independent Test**: Can be fully tested by (1) creating an email/password account, logging in, navigating to profile settings, clicking "Link Google Account", completing OAuth flow, and verifying Google is now a valid login method, OR (2) creating a Google account, logging in, navigating to profile settings, setting a password, and verifying password login now works.

**Acceptance Scenarios**:

1. **Given** a logged-in user with an email/password account is on their profile page, **When** they click "Link Google Account" and complete the Google OAuth flow, **Then** their Google account is linked and they can now log in using either method
2. **Given** a logged-in user with a Google account is on their profile page, **When** they set a password (meeting strength requirements), **Then** their password is stored and they can now log in using either method
3. **Given** a user tries to link a Google account that is already associated with a different HappyHub account, **When** the OAuth flow completes, **Then** the system displays "This Google account is already linked to another account" and does not link it
4. **Given** a user has both authentication methods linked, **When** they log in using either email/password or Google, **Then** they access the same account with all their data and reservations
5. **Given** a user wants to unlink their Google account, **When** they click "Unlink Google Account" in profile settings and they have a password set, **Then** the Google account is unlinked and they can only log in with email/password
6. **Given** a user tries to unlink their only authentication method (e.g., Google account when no password is set), **When** they attempt to unlink, **Then** the system displays "You must have at least one authentication method. Please set a password before unlinking Google" and prevents unlinking

---

### User Story 4 - Password Reset (Priority: P2)

A registered user who has forgotten their password can request a password reset. They receive an email with a secure reset link that allows them to create a new password without needing to remember the old one. Note: This only applies to accounts that have email/password authentication set up (not Google-only accounts without a password).

**Why this priority**: Password reset is essential for user retention and reduces support burden. While not required for the initial MVP launch, it becomes critical shortly after as users inevitably forget passwords. Without it, users who forget passwords are locked out permanently and require manual support intervention.

**Independent Test**: Can be fully tested by requesting a password reset for an existing email/password account, clicking the emailed link, setting a new password, and verifying that the new password works for login while the old password no longer works.

**Acceptance Scenarios**:

1. **Given** a user with an email/password account is on the password reset page, **When** they enter their registered email address, **Then** the system sends a password reset email with a secure, time-limited link
2. **Given** a user with a Google-only account (no password set) requests a password reset, **When** they enter their email, **Then** the system sends an email explaining they should use "Sign in with Google" or set a password from their profile after logging in
3. **Given** a user clicks a valid password reset link (not expired), **When** the link is opened, **Then** they are taken to a page where they can set a new password
4. **Given** a user enters a new password that meets strength requirements, **When** they submit the new password, **Then** their password is updated and they are logged in automatically
5. **Given** a user clicks an expired password reset link (older than 24 hours), **When** the link is opened, **Then** the system displays "This reset link has expired. Please request a new one"
6. **Given** a user enters an email that is not registered, **When** they request a password reset, **Then** the system displays a generic success message without revealing whether the email exists (security measure to prevent email enumeration)

---

### User Story 5 - Session Management and Logout (Priority: P3)

A logged-in user can explicitly log out of their account, clearing their session and requiring re-authentication for future access. Additionally, sessions automatically expire after a period of inactivity to enhance security.

**Why this priority**: Session management is important for security, especially on shared devices. While users can close the browser to end their session, explicit logout provides better control. This is a P2 feature because the core authentication (login/registration) can function without it initially, but it's needed before production launch for security compliance.

**Independent Test**: Can be fully tested by logging in, clicking the logout button, and verifying that protected pages are no longer accessible without re-authentication. Can also test session expiry by waiting for the timeout period and verifying that the user is automatically logged out.

**Acceptance Scenarios**:

1. **Given** a logged-in user clicks the logout button, **When** the logout action completes, **Then** their session is terminated and they are redirected to the homepage
2. **Given** a user has logged out, **When** they attempt to access a protected page (e.g., dashboard, reservations), **Then** they are redirected to the login page
3. **Given** a user is logged in but inactive for 30 days, **When** they attempt any action, **Then** their session is expired and they must log in again
4. **Given** a user is on a protected page and their session expires, **When** they attempt to perform an action, **Then** the system displays "Your session has expired. Please log in again" and redirects to login

---

### User Story 6 - Área privada (Private area) (Priority: P2)

A logged-in user can access their "Área privada" from the navigation menu. This private area serves as the user's personal dashboard and contains two main sections: (1) personal data, where they can view and update their profile information (name, phone, password, authentication methods, email as read-only), and (2) a list of their reservations showing key fields and their current status.

**Why this priority**: The private area is the primary destination after login and provides the core value of having an account: seeing your reservation history and managing personal data. Without it, authentication has no tangible benefit for the user. Elevated from P3 to P2 because it is directly tied to the login experience and gives meaning to the authentication flow.

**Independent Test**: Can be fully tested by logging in, clicking "Área privada" in the navigation, verifying the personal data section shows the user's information with editable fields, and verifying the reservations section shows a list of the user's bookings with their status.

**Acceptance Scenarios**:

1. **Given** a logged-in user clicks "Área privada" in the navigation, **When** the page loads, **Then** they see two sections: "Datos personales" (personal data) and "Mis reservas" (my reservations)
2. **Given** a logged-in user is on the Área privada page, **When** they view the personal data section, **Then** they see their name, phone, email (read-only), and authentication methods with options to edit
3. **Given** a logged-in user updates their name or phone number and saves, **When** the save completes, **Then** the changes are persisted and reflected immediately throughout the application
4. **Given** a user with an email/password account wants to change their password, **When** they enter their current password and a new password meeting strength requirements, **Then** their password is updated and they remain logged in
5. **Given** a user with a Google-only account wants to set a password, **When** they enter a new password meeting strength requirements (no current password needed), **Then** their password is set and they can now log in with email/password
6. **Given** a user attempts to change their password without entering the correct current password, **When** they submit the form, **Then** the system displays "Current password is incorrect" and does not update the password
7. **Given** a user views their profile, **When** the page loads, **Then** they can see their email address displayed as read-only with a message "Contacta con soporte para cambiar tu email"
8. **Given** a user is on the Área privada page, **When** they view the "Cuentas vinculadas" section, **Then** they see which authentication methods are active (Email/Password, Google) and options to link/unlink accounts
9. **Given** a logged-in user is on the Área privada page, **When** they view the "Mis reservas" section, **Then** they see a list of their reservations showing: date, time slot, event type, number of guests, total price, and status
10. **Given** a user has no reservations, **When** the reservations section loads, **Then** the system displays a friendly message "Aún no tienes reservas" with a CTA linking to "Reserva tu fecha"
11. **Given** a user has reservations, **When** the list renders, **Then** reservations are sorted by date (most recent first) and each shows a colored status badge (pending = yellow, approved = green, rejected = red, paid = blue)
12. **Given** a user clicks on a reservation in the list, **When** the detail opens, **Then** they can see the full reservation details including extras, deposit paid, and any messages
13. **Given** an unauthenticated visitor navigates to `/area-privada`, **When** the page loads, **Then** they are redirected to the login page

---

### Edge Cases

- What happens when a user attempts to register with an email that was previously registered but the account was deleted? (Should allow re-registration with either email/password or Google)
- How does the system handle concurrent login attempts from the same user on multiple devices? (Allow multiple sessions regardless of authentication method used)
- What happens if a user clicks a password reset link multiple times? (Only the most recent link should be valid, previous links should be invalidated)
- How does the system handle password reset requests for an email that doesn't exist? (Display generic success message to prevent email enumeration attacks)
- What happens if a user's session token is tampered with or corrupted? (Reject the token and redirect to login)
- How does the system handle registration attempts during a database outage? (Display user-friendly error message and suggest trying again later)
- What happens when a user tries to use an expired session token? (Clear the token and redirect to login with appropriate message)
- How does the system prevent brute-force login attempts? (Implement rate limiting: maximum 10 login attempts per IP address per hour for email/password authentication)
- What happens if Google OAuth service is temporarily unavailable? (Display error message "Google sign-in is temporarily unavailable. Please try again or use email/password login" and gracefully fall back to email/password option)
- What happens if a user tries to link a Google account that changes its email address after linking? (System maintains the link using Google's unique user ID, not email address)
- How does the system handle users who revoke HappyHub's access from their Google account? (Next login attempt with Google will fail, user should use email/password or re-authorize Google)
- What happens when a user with both authentication methods changes their Google account email but keeps the same Google ID? (System recognizes them by Google ID, updates email if different from HappyHub account email only with user confirmation)
- How does the system handle account linking race conditions (e.g., simultaneous link requests from multiple tabs)? (Use database-level unique constraints and atomic operations to prevent duplicate links)
- What happens if a user tries to create an account with Google while an email/password account with the same email exists but user doesn't know their password? (Provide clear message: "An account with this email already exists. Please log in with email/password and link your Google account from profile settings, or use password reset")
- What happens if a user made reservations before creating an account, using the same email? (Reservations are matched by email, so existing reservations appear in the Área privada once the user registers with that email)
- What happens if Stripe is unavailable when loading the reservation list? (Display error message "No se pudieron cargar tus reservas. Inténtalo de nuevo más tarde" with a retry button)
- What happens when a user's email in their account differs from the email used at booking time? (Only reservations matching the current account email are shown; reservations made with a different email are not visible)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow new users to create accounts by providing email address, password, full name, and phone number
- **FR-002**: System MUST validate email addresses are properly formatted (contain @ symbol and valid domain structure) before account creation
- **FR-003**: System MUST enforce password strength requirements: minimum 8 characters, at least one letter, at least one number
- **FR-004**: System MUST prevent registration of duplicate email addresses and display appropriate error message
- **FR-005**: System MUST store passwords using secure one-way hashing (never store plain text passwords)
- **FR-006**: System MUST allow registered users to authenticate by providing their email and password
- **FR-007**: System MUST generate and store an authentication token upon successful login that persists across page navigation
- **FR-008**: System MUST automatically authenticate users after successful registration (no separate login required)
- **FR-009**: System MUST display generic error messages for failed login attempts that do not reveal whether email or password was incorrect
- **FR-010**: System MUST allow logged-in users to explicitly end their session (logout) by clearing authentication token
- **FR-011**: System MUST automatically expire user sessions after 30 days of inactivity
- **FR-012**: System MUST redirect unauthenticated users attempting to access protected pages to the login page
- **FR-013**: System MUST allow users to request password reset by providing their registered email address
- **FR-014**: System MUST send password reset emails containing secure, time-limited links (valid for 24 hours)
- **FR-015**: System MUST invalidate previous password reset links when a new reset is requested for the same account
- **FR-016**: System MUST allow users to set a new password via valid reset link without requiring the old password
- **FR-017**: System MUST automatically authenticate users after successful password reset
- **FR-018**: System MUST send confirmation emails to users after successful registration
- **FR-019**: System MUST allow logged-in users to view and update their profile information (name, phone number)
- **FR-020**: System MUST allow logged-in users to change their password by providing both current and new password
- **FR-021**: System MUST verify current password before allowing password changes in profile settings
- **FR-022**: System MUST display email addresses as read-only in profile (no self-service email changes)
- **FR-023**: System MUST support multiple concurrent sessions for the same user across different devices
- **FR-024**: System MUST display user-friendly error messages for all validation failures (weak password, invalid email, etc.)
- **FR-025**: System MUST implement rate limiting to prevent brute-force attacks: maximum 10 login attempts per IP address per hour, with appropriate error message when limit exceeded
- **FR-026**: System MUST allow new users to register using Google OAuth by clicking "Sign up with Google" and completing Google's authentication flow
- **FR-027**: System MUST create user accounts from Google OAuth using profile information (email, name) provided by Google
- **FR-028**: System MUST prompt users for phone number during Google registration if not provided by Google profile
- **FR-029**: System MUST prevent duplicate account creation when a user tries to register with Google using an email that already exists in the system
- **FR-030**: System MUST allow registered users to authenticate using Google OAuth by clicking "Sign in with Google" and completing Google's authentication flow
- **FR-031**: System MUST generate and store an authentication token upon successful Google OAuth login that persists across page navigation
- **FR-032**: System MUST allow users with email/password accounts to link their Google account from profile settings
- **FR-033**: System MUST allow users with Google accounts to set a password from profile settings (enabling email/password login)
- **FR-034**: System MUST prevent linking a Google account that is already associated with a different HappyHub account
- **FR-035**: System MUST allow users with both authentication methods linked to log in using either email/password OR Google OAuth
- **FR-036**: System MUST allow users to unlink their Google account from profile settings only if they have an alternative authentication method (password) available
- **FR-037**: System MUST store Google user identifiers (OAuth sub/ID) separately from email addresses to maintain account linking even if Google email changes
- **FR-038**: System MUST handle Google OAuth service unavailability gracefully by displaying error messages and allowing fallback to email/password authentication
- **FR-039**: System MUST securely handle OAuth tokens and refresh tokens following OAuth 2.0 best practices
- **FR-040**: System MUST display clear authentication method indicators in profile settings showing which methods are active (Email/Password, Google)

#### Header and navigation behavior

- **FR-041**: System MUST display the user's email address in the header when authenticated, replacing the user icon shown to unauthenticated visitors
- **FR-042**: System MUST display a logout button next to the user's email in the header when authenticated
- **FR-043**: System MUST show a navigation item "Área privada" linking to `/area-privada` only when the user is authenticated
- **FR-044**: System MUST hide the "Área privada" navigation item when the user is not authenticated
- **FR-045**: System MUST truncate long email addresses in the header to avoid breaking the layout

#### Área privada (private area)

- **FR-046**: System MUST provide a protected page at `/area-privada` accessible only to authenticated users
- **FR-047**: System MUST redirect unauthenticated users accessing `/area-privada` to the login page
- **FR-048**: System MUST display a "Datos personales" section showing: name (editable), phone (editable), email (read-only), and authentication methods linked
- **FR-049**: System MUST display a "Mis reservas" section listing all reservations associated with the authenticated user's email
- **FR-050**: System MUST show the following fields for each reservation in the list: date, time slot, event type, number of guests, total price, and status
- **FR-051**: System MUST display reservation status using colored badges: pending (yellow), approved (green), rejected (red), paid (blue)
- **FR-052**: System MUST sort the reservation list by event date, most recent first
- **FR-053**: System MUST display a friendly empty state "Aún no tienes reservas" with a CTA to "Reserva tu fecha" when the user has no reservations
- **FR-054**: System MUST allow users to click on a reservation to view full details (extras, deposit paid, messages)
- **FR-055**: System MUST match reservations to the authenticated user by comparing the user's email with the reservation email stored in Stripe metadata

### Key Entities

- **User Account**: Represents a registered user with attributes including unique email address (primary identifier), hashed password (optional, null for Google-only accounts), full name, phone number, Google OAuth identifier (optional), account creation date, last login date, authentication methods enabled (email/password, Google, or both), and account status (active/inactive). Related to Reservation entities for tracking bookings.
- **Authentication Token**: Represents an active user session with attributes including token value, associated user account, creation timestamp, expiration timestamp (30 days from creation), authentication method used (email/password or Google), and device/browser information. Used to maintain authenticated state across requests.
- **Password Reset Request**: Represents a password reset action with attributes including unique token, associated user account, creation timestamp, expiration timestamp (24 hours from creation), and used status. Only one valid reset token per user at any time. Only applicable for accounts with email/password authentication enabled.
- **OAuth Account Link**: Represents a connection between a HappyHub account and a Google account with attributes including Google user ID (OAuth sub), associated HappyHub user account, link creation date, last used date, and link status (active/revoked). Enables users to authenticate using multiple methods.
- **User Reservation (read-only view)**: Represents a booking made by the user, retrieved from Stripe checkout sessions filtered by user email. Key display fields: reservation ID, event date, time slot (morning/afternoon/night), event type, number of guests, total price, deposit paid, payment status, and overall reservation status (pending/approved/rejected/paid). Reservations are not created through the Área privada, only viewed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete account registration in under 2 minutes from start to confirmation email receipt
- **SC-002**: Users can log in to their account in under 30 seconds with correct credentials
- **SC-003**: 95% of users successfully complete registration on their first attempt without encountering validation errors
- **SC-004**: 98% of password reset requests result in successful email delivery within 5 minutes
- **SC-005**: System maintains user sessions reliably for at least 30 days without requiring re-authentication
- **SC-006**: Zero plain-text passwords stored in the system (100% compliance with secure password storage)
- **SC-007**: System handles 100 concurrent login attempts without performance degradation (response time under 2 seconds)
- **SC-008**: Reduce account-related support tickets by 70% through self-service password reset and multiple authentication options
- **SC-009**: 90% of users who initiate password reset successfully complete the process and regain account access
- **SC-010**: Authentication errors (login failures, expired sessions) display user-friendly messages that 95% of users understand without requiring support
- **SC-011**: Users can complete Google OAuth registration in under 60 seconds (faster than traditional email/password)
- **SC-012**: 85% of users who link a secondary authentication method (Google to email/password or vice versa) successfully use both methods for login
- **SC-013**: Google OAuth authentication completes in under 10 seconds from button click to authenticated state
- **SC-014**: Account linking operations (link/unlink Google account) complete in under 15 seconds with clear confirmation feedback
- **SC-015**: 95% of Google OAuth flows complete successfully without errors (handling for Google service unavailability included)
- **SC-016**: Authenticated users can navigate from login to viewing their reservations in the Área privada in under 3 seconds
- **SC-017**: The reservation list in Área privada correctly displays all reservations associated with the user's email, with 100% accuracy on status badges
- **SC-018**: The "Área privada" menu item is visible only to authenticated users and never shown to unauthenticated visitors

## Assumptions *(mandatory)*

1. **Email Delivery**: We assume a reliable email service is available for sending confirmation and password reset emails. Standard SMTP or third-party service (SendGrid, AWS SES) will handle email delivery.

2. **Session Storage**: Authentication tokens will be stored client-side (localStorage or cookies) and server-side sessions will track active tokens. Token validation occurs on each protected request.

3. **Password Hashing**: Industry-standard bcrypt hashing algorithm with appropriate salt rounds will be used for password storage, consistent with existing HappyHub authentication implementation.

4. **Single Email Per Account**: Each email address can only be associated with one active account. Previously deleted accounts allow email reuse. An account can be linked to both email/password and Google OAuth, but each Google account can only link to one HappyHub account.

5. **Google OAuth Integration**: Google OAuth 2.0 will be used for social login. Standard OAuth flows (authorization code flow) will be implemented following Google's best practices and security guidelines.

6. **OAuth Account Linking**: Users can link multiple authentication methods (email/password and Google) to the same account, but must maintain at least one active method at all times.

7. **Google Profile Data**: Basic profile information from Google (email, name) will be requested during OAuth flow. Additional permissions beyond basic profile are out of scope.

8. **No Other Social Login Providers**: Only Google OAuth is supported in this phase. Facebook, Apple, Twitter, and other OAuth providers are out of scope.

9. **No Two-Factor Authentication (2FA)**: Two-factor authentication is not included in this feature scope. Standard single-factor authentication (password or Google OAuth) is sufficient for initial release.

10. **No Email Verification Requirement**: Users can access their accounts immediately after registration without verifying email ownership. Confirmation emails are informational rather than required for account activation.

11. **Session Expiry Policy**: 30-day session expiration balances security with user convenience. Users on shared devices should explicitly logout, while personal device users benefit from extended sessions. This applies to both email/password and Google OAuth sessions.

12. **No Account Deletion**: Self-service account deletion is not included in this scope. Users must contact support to request account closure.

13. **Mobile-Responsive Design**: All authentication pages (login, registration, password reset, profile, account linking) will be fully responsive and optimized for mobile devices, consistent with existing HappyHub design patterns.

14. **Integration with Existing Roles**: Authentication will integrate with existing HappyHub role system (client, provider, admin) defined in JWT payload. Role assignment occurs during registration based on registration type (default: client role), regardless of authentication method used.

15. **GDPR Compliance**: Basic privacy practices will be followed (secure password storage, OAuth token handling, no unnecessary data collection), but full GDPR compliance (data portability, right to erasure, etc.) is handled separately from authentication implementation.

16. **Google OAuth Availability**: We assume Google OAuth service has high availability (99%+ uptime). Graceful degradation to email/password authentication will handle temporary Google service outages.

## Dependencies *(mandatory)*

### Technical Dependencies
- Existing JWT authentication infrastructure (token generation and validation)
- Email service integration (n8n workflow or direct SMTP)
- Database schema supporting user accounts (email, password hash, Google OAuth ID, profile fields)
- Existing API client infrastructure (src/lib/apiClient.ts) for authenticated requests
- Google OAuth 2.0 API access and credentials (Client ID, Client Secret)
- OAuth client library compatible with Next.js (e.g., NextAuth.js, next-auth, or Google's official OAuth library)
- HTTPS endpoint for OAuth callbacks (required by Google OAuth security requirements)

### Business Dependencies
- User role definitions (client, provider, admin) and permission model
- Email template designs for confirmation and password reset messages
- Support process for handling email change requests and account recovery edge cases
- Google Cloud Console project with OAuth 2.0 credentials configured
- Privacy policy and terms of service updated to include Google OAuth data handling

### Design Dependencies
- UI/UX designs for registration, login, password reset, profile, and account linking pages
- Google sign-in button design following Google's brand guidelines
- Form validation patterns and error message styling consistent with existing HappyHub forms
- Mobile-responsive layouts for all authentication pages including OAuth flows
- Loading states and error messages for OAuth operations

## Out of Scope *(mandatory)*

The following items are explicitly excluded from this feature:

1. **Other Social Login Providers**: No integration with Facebook, Apple, Twitter, Microsoft, or other OAuth providers beyond Google
2. **Two-Factor Authentication (2FA)**: No SMS, authenticator app, or email-based second factor
3. **Email Verification**: No requirement to verify email ownership before account activation
4. **Account Deletion**: No self-service account closure (requires support intervention)
5. **Email Address Changes**: Users cannot change their registered email without support assistance
6. **Enterprise Single Sign-On (SSO)**: No integration with enterprise identity providers (SAML, LDAP, Active Directory)
7. **Biometric Authentication**: No fingerprint, face recognition, or other biometric login methods
8. **Magic Links/Passwordless**: No email-based passwordless authentication (separate from OAuth)
9. **Remember Me Checkbox**: Session duration is fixed at 30 days (no user-selectable options)
10. **Account Recovery via Security Questions**: Only password reset via email is supported
11. **Login History/Audit Log**: No user-visible log of login attempts or session history
12. **Device Management**: No ability for users to view or revoke sessions on other devices
13. **Password Expiration**: Passwords do not force periodic changes (remain valid indefinitely until changed by user)
14. **Advanced Rate Limiting/CAPTCHA**: Basic protection may be included but advanced bot prevention is separate effort
15. **OAuth Refresh Token Management**: No user-facing controls for OAuth token refresh or expiration handling
16. **Account Merging**: No ability to merge two separate accounts if a user accidentally creates duplicates

## Risks *(optional)*

### Security Risks
- **Brute Force Attacks**: Without rate limiting or account lockout, attackers could attempt many login combinations via email/password. Mitigation: implement rate limiting (10 attempts per IP per hour) and consider CAPTCHA after repeated failures.
- **Password Reset Token Leakage**: If reset emails are intercepted or tokens are predictable, unauthorized password changes could occur. Mitigation: use cryptographically secure random tokens and HTTPS for all reset links.
- **Session Hijacking**: If authentication tokens are exposed (XSS, network interception), attackers could impersonate users. Mitigation: secure token storage (httpOnly cookies preferred over localStorage), HTTPS enforcement, and appropriate token expiration.
- **OAuth Token Theft**: If OAuth tokens are compromised, attackers could access Google-linked accounts. Mitigation: follow OAuth 2.0 security best practices, store tokens securely, implement PKCE for authorization code flow, and validate redirect URIs.
- **CSRF Attacks on OAuth**: Attackers could trick users into linking their Google account to attacker's HappyHub account. Mitigation: implement state parameter validation in OAuth flow and use anti-CSRF tokens.
- **Account Takeover via OAuth**: If Google account is compromised, attacker gains access to linked HappyHub account. Mitigation: educate users about Google account security, provide option to unlink and use password authentication.

### User Experience Risks
- **Password Reset Email Delays**: If email delivery is slow, users may request multiple resets causing confusion. Mitigation: clear messaging about expected delivery time and checking spam folders.
- **Lost Access Due to Forgotten Email**: Users who register with incorrect email addresses cannot recover accounts. Mitigation: display email confirmation during registration and encourage users to verify before completing.
- **Session Expiration Frustration**: 30-day timeout may be too short for infrequent users or too long for security-conscious users. Mitigation: clear communication about session duration and easy re-login process.
- **Google OAuth Service Outages**: If Google OAuth is down, users with Google-only accounts cannot log in. Mitigation: display clear error messages encouraging users to set a password as backup, monitor Google OAuth status.
- **Confusion About Multiple Auth Methods**: Users may not understand they can use either email/password or Google after linking. Mitigation: clear UI indicators in profile showing active auth methods and how to use each.

### Technical Risks
- **Email Service Dependency**: If email service fails, password resets and confirmations break. Mitigation: monitor email delivery, implement retry logic, and provide alternative support contact for edge cases.
- **Token Storage Compatibility**: Different browsers handle localStorage/cookies differently, especially with privacy settings. Mitigation: test across browsers and provide clear guidance if authentication doesn't persist.
- **Database Performance**: Authentication queries on email and OAuth ID indexes must remain fast as user base grows. Mitigation: ensure proper database indexing on email and google_oauth_id fields, monitor query performance.
- **OAuth Callback Failures**: Network issues or misconfigurations could break OAuth callback flow. Mitigation: implement robust error handling, logging, and fallback messages with support contact.
- **Google API Changes**: Changes to Google OAuth API could break authentication. Mitigation: use stable API versions, monitor Google developer announcements, implement comprehensive error handling.

## Notes *(optional)*

### Integration with Existing HappyHub Features
- Authentication replaces hardcoded demo users (admin@happyhub.es, proveedor@happyhub.es) currently in `/api/auth.ts`
- Authenticated users will have their information pre-filled in reservation forms (name, email, phone) regardless of authentication method used
- Profile information will be reflected in n8n workflows for reservation confirmations and notifications
- User accounts enable future features like reservation history, saved payment methods, and personalized recommendations
- Google OAuth integration may require updates to privacy policy and terms of service

### Alignment with HappyHub Architecture
- Continues use of JWT tokens stored in localStorage for consistency with current implementation (tokens will include authentication method metadata)
- Follows existing Zod validation patterns defined in `src/utils/validators.ts` for email/password forms
- Integrates with existing API client (`src/lib/apiClient.ts`) for automatic token injection
- Maintains Tailwind CSS styling conventions and responsive design patterns
- OAuth implementation should use industry-standard library (NextAuth.js recommended for Next.js) rather than custom OAuth flow

### Future Enhancement Considerations
- Once dual-method authentication is established, future phases could add:
  - Additional social login options (Facebook, Apple) following same pattern as Google
  - Two-factor authentication for high-value accounts (providers, admin)
  - Email verification to reduce fake/spam accounts
  - Enhanced profile features (avatar upload, communication preferences)
  - Account activity history and session management dashboard
  - Device-specific session management (view and revoke sessions per device)
  - OAuth scope expansion for calendar integration or other Google services

### Compliance Considerations
- Password hashing with bcrypt satisfies basic security best practices
- Generic error messages for failed login attempts prevent user enumeration attacks
- 24-hour password reset token expiration limits attack window
- However, full security audit and penetration testing recommended before production launch

### Success Metrics Beyond Initial Criteria
- **User Adoption**: Track percentage of reservation bookings made by authenticated vs. guest users
- **Password Reset Usage**: Monitor frequency of password reset requests to identify UX issues
- **Support Ticket Reduction**: Measure decrease in account access and password-related support requests
- **Session Retention**: Analyze how long users remain logged in before session expiry to validate 30-day timeout assumption
