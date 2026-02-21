# Authentication Implementation Research
**Project:** HappyHub Event Booking Platform
**Date:** 2026-02-20
**Context:** Next.js 14 Pages Router, PostgreSQL, JWT auth (localStorage)

## 1. OAuth Library Selection for Next.js Pages Router

### Decision: NextAuth.js v4 (now Auth.js)

**Rationale:**
NextAuth.js v4 provides robust OAuth integration specifically designed for Next.js Pages Router with built-in Google OAuth provider, session management, JWT support, and account linking capabilities. Unlike v5 (which targets App Router), v4 is stable and battle-tested for Pages Router applications. It integrates seamlessly with existing JWT infrastructure by allowing custom JWT callbacks to modify token payloads.

**Alternatives Considered:**
- **Custom OAuth implementation** - Maximum flexibility but requires implementing OAuth 2.0 flow, state management, PKCE, token refresh, security validations from scratch. High maintenance burden.
- **Passport.js** - Node.js authentication middleware requiring Express.js adapter for Next.js API routes. Not Next.js-native, requires additional boilerplate.
- **next-oauth** - Lightweight but lacks account linking features, session management, and community support compared to NextAuth.js.

**Implementation Notes:**
- Install: `npm install next-auth@^4.24.5` (already in package.json)
- Create `/pages/api/auth/[...nextauth].ts` for all auth routes
- Configure Google provider with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Use JWT strategy (not database sessions) to maintain localStorage compatibility
- Custom JWT callback to add `role`, `authMethod` to token payload
- Custom session callback to expose user data to frontend
- SignIn callback for account linking logic

**Key Configuration:**
```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validate against database
      }
    })
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  jwt: { secret: process.env.JWT_SECRET },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.authMethod = account?.provider || 'credentials';
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.role = token.role;
      session.user.authMethod = token.authMethod;
      return session;
    },
    async signIn({ user, account, profile }) {
      // Account linking logic here
      return true;
    }
  }
});
```

---

## 2. Database Schema for Multi-Auth

### Decision: Single `users` table with optional password + separate `accounts` table

**Rationale:**
NextAuth.js follows OAuth 2.0 best practices by separating user identity from provider credentials. The `users` table stores core user data with nullable `password_hash` (for Google-only accounts), while the `accounts` table stores OAuth provider data (provider, providerAccountId, tokens). This enables multiple OAuth providers per user, account linking without conflicts, and supports both email/password and OAuth login methods.

**Alternatives Considered:**
- **Single users table only** - Simpler but difficult to handle multiple OAuth providers, refresh token storage, and account linking conflicts.
- **Separate tables per auth method** - Creates data duplication, complicates queries, and prevents account linking.
- **Provider-specific columns** - Doesn't scale beyond 1-2 providers, creates NULL columns for most users.

**Implementation Notes:**

**Extended Users Table:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMP, -- NULL until verified
    password_hash VARCHAR(255), -- NULL for OAuth-only accounts
    name VARCHAR(255),
    phone VARCHAR(50),
    image VARCHAR(500), -- Avatar from Google profile
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN users.password_hash IS 'bcrypt hash, NULL for OAuth-only accounts';
COMMENT ON COLUMN users.email_verified IS 'Timestamp when email was verified (OAuth or email verification)';
```

**Accounts Table (NextAuth.js standard):**
```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'oauth', 'email', 'credentials'
    provider VARCHAR(50) NOT NULL, -- 'google', 'credentials'
    provider_account_id VARCHAR(255) NOT NULL, -- Google user ID
    refresh_token TEXT, -- For token refresh
    access_token TEXT, -- OAuth access token
    expires_at INTEGER, -- Unix timestamp
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
COMMENT ON TABLE accounts IS 'OAuth provider accounts linked to users (NextAuth.js standard)';
```

**Sessions Table (optional, for database sessions):**
```sql
-- NOT NEEDED if using JWT strategy
-- Include only if switching to database sessions later
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Verification Tokens (email verification):**
```sql
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL, -- email
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
);

COMMENT ON TABLE verification_tokens IS 'Email verification tokens for new signups';
```

**Migration Strategy:**
1. Add `email_verified`, `image` columns to existing `users` table
2. Allow `password_hash` to be NULL
3. Create `accounts` and `verification_tokens` tables
4. Existing demo users: Insert row in `accounts` with `provider='credentials'`

**Handling Unique Constraints:**
- `users.email` remains UNIQUE to prevent duplicate accounts
- `accounts(provider, provider_account_id)` prevents duplicate OAuth links
- Account linking checks if email exists before creating user

---

## 3. OAuth Security Best Practices

### Decision: NextAuth.js built-in security + PKCE enforcement

**Rationale:**
NextAuth.js v4 implements OAuth 2.0 security best practices by default including PKCE flow, state parameter validation, CSRF token protection via signed cookies, secure token storage, and automatic token refresh. Manual implementation is unnecessary and error-prone. PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks.

**Alternatives Considered:**
- **Manual OAuth implementation** - Requires implementing PKCE, state validation, nonce handling, CSRF protection manually. High risk of security vulnerabilities.
- **Third-party OAuth libraries** - Add dependency complexity without significant benefits over NextAuth.js.

**Implementation Notes:**

**1. PKCE Flow (Automatic):**
- NextAuth.js automatically generates `code_verifier` and `code_challenge`
- Uses S256 (SHA-256) challenge method
- No additional configuration required for Google OAuth

**2. State Parameter Validation (Automatic):**
- NextAuth.js generates cryptographic random state parameter
- Validates state in callback to prevent CSRF
- Stored in encrypted session cookie

**3. Token Storage:**
- **JWT tokens:** Stored in `next-auth.session-token` HTTP-only cookie (secure, sameSite=lax)
- **OAuth tokens:** Stored in `accounts` table (access_token, refresh_token encrypted at rest)
- **Never expose tokens to client-side JavaScript**

**4. CSRF Prevention:**
- NextAuth.js uses CSRF tokens in cookies
- Validates CSRF token on every auth request
- Double submit cookie pattern

**5. Environment Variables (add to .env):**
```bash
# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth security
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Token expiry
JWT_MAX_AGE=2592000  # 30 days in seconds
```

**6. Google Cloud Console Setup:**
- Create OAuth 2.0 Client ID
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (dev), `https://yourdomain.com/api/auth/callback/google` (prod)
- Enable Google+ API for profile access

**7. Token Refresh Strategy:**
- NextAuth.js automatically refreshes OAuth tokens before expiry
- Implement refresh token rotation in JWT callback:
```typescript
async jwt({ token, account }) {
  if (account?.refresh_token) {
    token.refreshToken = account.refresh_token;
    token.accessTokenExpires = account.expires_at;
  }

  // Refresh token if expired
  if (Date.now() < token.accessTokenExpires) {
    return token;
  }
  return refreshAccessToken(token);
}
```

**8. Security Checklist:**
- ✅ HTTPS enforced in production (Vercel default)
- ✅ HTTP-only cookies for session tokens
- ✅ Signed and encrypted cookies
- ✅ CSRF protection enabled
- ✅ State parameter validation
- ✅ Secure token storage (not localStorage)
- ✅ Token refresh rotation
- ✅ Rate limiting on auth endpoints (add middleware)

---

## 4. Account Linking Strategy

### Decision: Email-based automatic linking with explicit confirmation UI

**Rationale:**
When a user signs in with Google using an email that already exists in the database, automatically link the Google account to the existing user account after showing a confirmation prompt. This prevents duplicate accounts, maintains data continuity, and improves user experience. For setting passwords on Google-only accounts, provide a "Set Password" flow requiring current session validation.

**Alternatives Considered:**
- **Manual linking only** - Forces users to remember which login method they used, causes frustration with "account not found" errors.
- **Always create new account** - Creates duplicate accounts, fragments user data, complicates admin management.
- **Block OAuth if email exists** - Poor UX, prevents users from switching login methods.

**Implementation Notes:**

**Scenario 1: Link Google to existing email/password account**

1. User signs up with email/password → `users.password_hash` populated
2. User later clicks "Sign in with Google" using same email
3. NextAuth.js `signIn` callback detects email match:
```typescript
async signIn({ user, account, profile }) {
  if (account.provider === 'google') {
    // Check if user with this email exists
    const existingUser = await db.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [profile.email]
    );

    if (existingUser.rows.length > 0) {
      // Check if already linked
      const linkedAccount = await db.query(
        'SELECT id FROM accounts WHERE user_id = $1 AND provider = $2',
        [existingUser.rows[0].id, 'google']
      );

      if (linkedAccount.rows.length === 0) {
        // Link Google account
        await db.query(
          'INSERT INTO accounts (user_id, type, provider, provider_account_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [existingUser.rows[0].id, 'oauth', 'google', profile.sub, account.access_token, account.refresh_token, account.expires_at]
        );
      }

      // Update email_verified if not set
      if (!existingUser.rows[0].email_verified) {
        await db.query(
          'UPDATE users SET email_verified = NOW(), image = $1 WHERE id = $2',
          [profile.picture, existingUser.rows[0].id]
        );
      }

      user.id = existingUser.rows[0].id; // Use existing user ID
    }
  }
  return true;
}
```

**Scenario 2: Set password for Google-only account**

1. User signed up with Google → `users.password_hash = NULL`
2. User navigates to `/account/set-password` (authenticated route)
3. Form requires: new password, confirm password
4. API endpoint `/api/auth/set-password`:
```typescript
// Requires valid session
const session = await getServerSession(req, res, authOptions);
if (!session) return res.status(401).json({ error: 'Unauthorized' });

const { password } = req.body;

// Validate password strength (min 8 chars, 1 uppercase, 1 number)
if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
  return res.status(400).json({ error: 'Password too weak' });
}

const passwordHash = await bcrypt.hash(password, 10);

await db.query(
  'UPDATE users SET password_hash = $1 WHERE id = $2 AND password_hash IS NULL',
  [passwordHash, session.user.id]
);

// Create credentials account entry
await db.query(
  'INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
  [session.user.id, 'credentials', 'credentials', session.user.id]
);
```

**Scenario 3: Handle email conflict (edge case)**

Race condition: Two users simultaneously sign up with same email via different methods.

**Solution:** Database unique constraint on `users.email` prevents duplication. Second request fails with UNIQUE_VIOLATION error. Catch error and prompt user to use existing login method.

```typescript
try {
  await db.query('INSERT INTO users (email, name, ...) VALUES ($1, $2, ...)', [email, name]);
} catch (error) {
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Email already registered',
      hint: 'Try signing in with password or Google'
    });
  }
  throw error;
}
```

**Database Atomic Operations:**

Use transactions for account linking to prevent race conditions:
```typescript
const client = await db.connect();
try {
  await client.query('BEGIN');

  // Check and link
  const existingUser = await client.query('SELECT id FROM users WHERE email = $1 FOR UPDATE', [email]);

  if (existingUser.rows.length > 0) {
    await client.query('INSERT INTO accounts (...) VALUES (...)', [...]);
  } else {
    await client.query('INSERT INTO users (...) VALUES (...)', [...]);
    await client.query('INSERT INTO accounts (...) VALUES (...)', [...]);
  }

  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

**UI/UX Flow:**

1. **Confirmation prompt on first Google sign-in:**
   - "We found an account with this email. Link your Google account?"
   - Buttons: "Link Accounts", "Cancel"

2. **Account settings page:**
   - Show connected login methods: "Email/Password ✓", "Google ✓"
   - "Set Password" button if Google-only account
   - "Connect Google" button if email/password-only account

3. **Error messages:**
   - "This email is already registered. Try signing in with password."
   - "Google account successfully linked!"

---

## 5. Session Management with Dual Auth

### Decision: JWT tokens with 30-day expiry + `authMethod` field in payload

**Rationale:**
Continue using JWT tokens for stateless authentication (aligns with current localStorage approach), but migrate to HTTP-only cookies via NextAuth.js for improved security. JWT payload includes `userId`, `email`, `role`, and `authMethod` (values: 'credentials', 'google') to track authentication method. 30-day expiry matches typical "Remember Me" behavior. Token refresh happens automatically via NextAuth.js session callbacks.

**Alternatives Considered:**
- **Database sessions** - Requires session table, database queries on every request, not compatible with existing localStorage approach.
- **Separate tokens per auth method** - Complicates frontend logic, no clear benefit.
- **Short-lived tokens (1 hour)** - Poor UX, frequent re-authentication interrupts booking flow.

**Implementation Notes:**

**JWT Payload Structure:**
```typescript
interface JWTPayload {
  userId: number;          // Database user.id
  email: string;           // User email
  role: 'client' | 'provider' | 'admin';
  authMethod: 'credentials' | 'google'; // How user authenticated
  iat: number;             // Issued at (Unix timestamp)
  exp: number;             // Expires at (Unix timestamp, iat + 30 days)
}
```

**NextAuth.js Configuration:**
```typescript
// pages/api/auth/[...nextauth].ts
export default NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On sign in
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.role = user.role;
        token.authMethod = account?.provider === 'google' ? 'google' : 'credentials';
      }
      return token;
    },
    async session({ session, token }) {
      // Expose to frontend via getSession()
      session.user.id = token.userId;
      session.user.email = token.email;
      session.user.role = token.role;
      session.user.authMethod = token.authMethod;
      return session;
    },
  },
});
```

**Token Storage Migration:**

**Before (current):** JWT in localStorage
```typescript
// Login
localStorage.setItem('token', response.data.token);

// API requests
axios.get('/api/endpoint', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});
```

**After (NextAuth.js):** JWT in HTTP-only cookie
```typescript
// Login
await signIn('credentials', { email, password, redirect: false });
// OR
await signIn('google', { redirect: false });

// API requests (no manual token handling)
const session = await getSession(); // Automatically reads cookie
```

**Session Expiry:**
- JWT exp claim set to 30 days from issue
- NextAuth.js automatically handles expiry checking
- On expiry: User redirected to login page
- No refresh token needed for credentials login
- Google OAuth refresh token stored in `accounts` table for token refresh

**Frontend Session Access:**

**Client-side (React components):**
```typescript
import { useSession } from 'next-auth/react';

export default function Component() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <Spinner />;
  if (status === 'unauthenticated') return <LoginPrompt />;

  return (
    <div>
      Welcome {session.user.name}!
      Auth method: {session.user.authMethod}
      Role: {session.user.role}
    </div>
  );
}
```

**Server-side (API routes):**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Access session.user.id, session.user.role, session.user.authMethod
}
```

**Protected Routes:**

Wrap pages with `getServerSideProps`:
```typescript
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
```

**Backward Compatibility:**

To maintain existing API client behavior during migration:

1. Keep `Authorization: Bearer <token>` header support in API routes
2. Add dual token verification:
```typescript
async function getUserFromRequest(req) {
  // Try NextAuth session first
  const session = await getServerSession(req, res, authOptions);
  if (session) return session.user;

  // Fallback to Authorization header (old method)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  }

  return null;
}
```

3. Gradually migrate frontend components from localStorage to `useSession()`

**Security Improvements:**

| Aspect | Before (localStorage) | After (NextAuth.js) |
|--------|----------------------|---------------------|
| Token storage | localStorage (XSS vulnerable) | HTTP-only cookie (XSS protected) |
| CSRF protection | None | Automatic via NextAuth.js |
| Token refresh | Manual | Automatic |
| OAuth flow | Manual implementation | Built-in, secure |
| Session expiry | Manual checking | Automatic |

---

## Migration Checklist

### Phase 1: Database Setup
- [ ] Run migration to add `email_verified`, `image` to `users` table
- [ ] Allow `password_hash` to be NULL in `users` table
- [ ] Create `accounts` table
- [ ] Create `verification_tokens` table
- [ ] Create indexes on `accounts(user_id)`, `accounts(provider, provider_account_id)`

### Phase 2: NextAuth.js Setup
- [ ] Verify `next-auth@^4.24.5` in package.json
- [ ] Create `/pages/api/auth/[...nextauth].ts` with Google + Credentials providers
- [ ] Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` to `.env`
- [ ] Configure JWT callbacks for `userId`, `role`, `authMethod`
- [ ] Implement account linking logic in `signIn` callback
- [ ] Test Google OAuth flow in development

### Phase 3: UI Updates
- [ ] Create `/login` page with both email/password form + "Sign in with Google" button
- [ ] Create `/signup` page with both email/password form + "Sign up with Google" button
- [ ] Add "Set Password" page at `/account/set-password` for Google-only accounts
- [ ] Create `/account/linked-accounts` page showing connected login methods
- [ ] Add "Connect Google" button for email/password-only accounts

### Phase 4: API Migration
- [ ] Create `/api/auth/set-password` endpoint
- [ ] Update existing API routes to use `getServerSession()`
- [ ] Maintain backward compatibility with `Authorization: Bearer` header
- [ ] Add rate limiting middleware to auth endpoints
- [ ] Update `/api/auth` verification endpoint to support NextAuth sessions

### Phase 5: Frontend Migration
- [ ] Replace `useAuth()` hook with `useSession()` from next-auth/react
- [ ] Update `apiClient.ts` to use NextAuth sessions instead of localStorage
- [ ] Add `SessionProvider` to `_app.tsx`
- [ ] Update protected pages to use `getServerSideProps` with session checking
- [ ] Remove localStorage token handling from login/logout flows

### Phase 6: Testing
- [ ] Test email/password signup → login flow
- [ ] Test Google OAuth signup → login flow
- [ ] Test Google linking to existing email/password account
- [ ] Test setting password for Google-only account
- [ ] Test password reset flow (new feature)
- [ ] Test session expiry after 30 days
- [ ] Test protected routes redirect to login
- [ ] Test role-based access control (client, provider, admin)
- [ ] Test concurrent login attempts with same email (race condition)

### Phase 7: Security Audit
- [ ] Verify HTTP-only cookies in browser DevTools
- [ ] Confirm CSRF tokens in requests
- [ ] Test XSS vulnerability (ensure tokens not in localStorage)
- [ ] Verify HTTPS enforced in production
- [ ] Review OAuth callback URLs in Google Cloud Console
- [ ] Test token refresh rotation
- [ ] Add rate limiting to prevent brute force attacks

---

## Environment Variables Summary

Add to `.env`:
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Database (already present)
DATABASE_URL=postgresql://user:password@host:5432/happyhub

# JWT (already present)
JWT_SECRET=your-jwt-secret-here
```

---

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Next.js Pages Router Authentication](https://nextjs.org/docs/pages/building-your-application/authentication)

---

## Summary

This research recommends:
1. **NextAuth.js v4** for OAuth + credentials authentication
2. **users + accounts tables** for flexible multi-auth support
3. **Built-in security** via NextAuth.js (PKCE, CSRF, secure cookies)
4. **Email-based account linking** with automatic detection
5. **JWT in HTTP-only cookies** with 30-day expiry, `authMethod` field

Implementation effort: ~3-5 days for full migration including testing.
