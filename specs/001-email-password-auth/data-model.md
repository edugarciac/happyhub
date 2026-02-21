# Data Model: Email/Password and Google OAuth Authentication

**Feature**: 001-email-password-auth
**Created**: 2026-02-20
**References**: [spec.md](spec.md), [research.md](research.md)

## Overview

Data model supporting dual authentication (email/password + Google OAuth) with account linking capabilities. Based on NextAuth.js adapter schema extended with HappyHub-specific fields.

## Entities

### 1. User

**Purpose**: Core user identity and profile information

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address (primary identifier) |
| email_verified | TIMESTAMP | NULL | When email was verified (null = unverified) |
| name | VARCHAR(100) | NOT NULL | Full name |
| phone | VARCHAR(20) | NOT NULL | Phone number (E.164 format preferred) |
| image | VARCHAR(500) | NULL | Profile image URL (from Google or uploaded) |
| role | ENUM | NOT NULL, DEFAULT 'client' | User role: 'client', 'provider', 'admin' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last profile update timestamp |
| last_login_at | TIMESTAMP | NULL | Last successful login timestamp |

**Indexes**:
- `idx_users_email` (email) - Unique constraint + fast lookup
- `idx_users_role` (role) - Filter users by role

**Validation Rules**:
- Email: Must be valid format (regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
- Phone: Must be valid format (can be validated via Zod schema)
- Role: Must be one of: 'client', 'provider', 'admin'
- Name: Min 2 chars, max 100 chars

**Relationships**:
- ONE User → MANY Accounts (OAuth providers)
- ONE User → MANY PasswordResetTokens
- ONE User → MANY Sessions
- ONE User → MANY Reservations (existing HappyHub entity)

---

### 2. Account

**Purpose**: OAuth provider linkage (Google, future providers)

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique account identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| type | VARCHAR(50) | NOT NULL | Provider type: 'oauth' |
| provider | VARCHAR(50) | NOT NULL | Provider name: 'google' |
| provider_account_id | VARCHAR(255) | NOT NULL | Google user ID (OAuth sub) |
| refresh_token | TEXT | NULL | OAuth refresh token (encrypted) |
| access_token | TEXT | NULL | OAuth access token (encrypted) |
| expires_at | INTEGER | NULL | Access token expiry (Unix timestamp) |
| token_type | VARCHAR(50) | NULL | Token type: 'Bearer' |
| scope | TEXT | NULL | OAuth scopes granted |
| id_token | TEXT | NULL | OpenID Connect ID token |
| session_state | TEXT | NULL | OAuth session state |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Link creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last token refresh timestamp |

**Indexes**:
- `idx_accounts_user_id` (user_id) - Find accounts for user
- `idx_accounts_provider_account` (provider, provider_account_id) - Unique constraint per provider

**Unique Constraints**:
- `(provider, provider_account_id)` - One Google account can only link to one HappyHub account

**Validation Rules**:
- Provider: Must be 'google' (extend for future providers)
- Type: Must be 'oauth'
- provider_account_id: Required, comes from Google OAuth sub claim

**Relationships**:
- MANY Accounts → ONE User

**Security Notes**:
- Tokens should be encrypted at rest if storing in database
- Consider token encryption: `pgcrypto` extension or application-level encryption
- Refresh tokens enable long-term access without re-authorization

---

### 3. PasswordCredential

**Purpose**: Email/password authentication credentials

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique credential identifier |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL | Associated user (one password per user) |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash of password |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Password creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last password change timestamp |

**Indexes**:
- `idx_password_cred_user_id` (user_id) - Unique constraint + fast lookup

**Validation Rules**:
- password_hash: Must be bcrypt hash (starts with `$2a$`, `$2b$`, or `$2y$`)
- User can have at most ONE PasswordCredential

**Relationships**:
- ONE PasswordCredential → ONE User (optional, nullable foreign key from User perspective)

**Security Notes**:
- Always use bcrypt with salt rounds ≥ 10
- Never store plain text passwords
- Password hash column should NOT be selected in default queries (exclude from API responses)

**Alternative Design**: Merge into User table with nullable `password_hash` column (simpler, recommended for this feature)

---

### 4. PasswordResetToken

**Purpose**: Time-limited password reset requests

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique token identifier |
| user_id | UUID | FK → users.id, NOT NULL | User requesting reset |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Secure random token (URL-safe) |
| expires_at | TIMESTAMP | NOT NULL | Token expiration (24 hours from creation) |
| used | BOOLEAN | NOT NULL, DEFAULT false | Whether token has been used |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Token creation timestamp |

**Indexes**:
- `idx_password_reset_token` (token) - Unique constraint + fast lookup
- `idx_password_reset_user_expires` (user_id, expires_at) - Invalidate old tokens

**Validation Rules**:
- Token: Min 32 characters, URL-safe (generated via `crypto.randomBytes(32).toString('base64url')`)
- expires_at: Must be 24 hours from creation
- Only ONE valid (unused, not expired) token per user at a time

**Relationships**:
- MANY PasswordResetTokens → ONE User

**Lifecycle**:
1. User requests password reset → Create token (mark all previous tokens for this user as used)
2. User clicks email link → Validate token (not expired, not used)
3. User sets new password → Mark token as used, update user password_hash

---

### 5. Session

**Purpose**: Active user sessions (JWT-based, optional database tracking)

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique session identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| session_token | VARCHAR(255) | UNIQUE, NOT NULL | JWT or opaque token |
| auth_method | VARCHAR(20) | NOT NULL | Auth method used: 'password', 'google' |
| expires_at | TIMESTAMP | NOT NULL | Session expiration (30 days from creation) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Session creation timestamp |
| last_activity_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last activity timestamp |
| ip_address | INET | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent string |

**Indexes**:
- `idx_session_token` (session_token) - Unique constraint + fast lookup
- `idx_session_user_expires` (user_id, expires_at) - Find active sessions for user

**Validation Rules**:
- expires_at: Must be ≤ 30 days from creation
- auth_method: Must be 'password' or 'google'

**Relationships**:
- MANY Sessions → ONE User

**Notes**:
- **Optional entity**: If using stateless JWT (localStorage), session tracking is optional
- **If implemented**: Enables features like "view active sessions", "logout all devices"
- **Security**: Allows detecting suspicious activity (multiple IPs, rapid location changes)

---

### 6. RateLimitLog (Optional)

**Purpose**: Track login attempts for rate limiting (10 attempts/IP/hour)

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGSERIAL | PK, NOT NULL | Auto-increment ID |
| ip_address | INET | NOT NULL | Client IP address |
| endpoint | VARCHAR(100) | NOT NULL | Endpoint attempted: 'login', 'register' |
| success | BOOLEAN | NOT NULL | Whether attempt succeeded |
| attempted_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Attempt timestamp |

**Indexes**:
- `idx_rate_limit_ip_endpoint_time` (ip_address, endpoint, attempted_at) - Count recent attempts

**Validation Rules**:
- Cleanup: Delete records older than 1 hour periodically

**Relationships**: None (standalone logging)

**Alternative**: Use in-memory store (Redis) or rate limiting middleware (express-rate-limit) instead of database

---

## Entity Relationships Diagram

```
┌──────────────────────┐
│       User           │
│ ──────────────────── │
│ id (PK)              │
│ email (UNIQUE)       │◄─────┐
│ name                 │      │
│ phone                │      │
│ role                 │      │
│ created_at           │      │
│ last_login_at        │      │
└──────────────────────┘      │
         │                    │
         │ 1                  │
         │                    │
         │ *                  │
         ▼                    │
┌──────────────────────┐      │
│      Account         │      │
│ ──────────────────── │      │
│ id (PK)              │      │
│ user_id (FK)         │──────┘
│ provider             │
│ provider_account_id  │
│ access_token         │
│ refresh_token        │
│ expires_at           │
└──────────────────────┘

         │ 1
         │
         │ *
         ▼
┌──────────────────────┐
│ PasswordCredential   │
│ ──────────────────── │
│ id (PK)              │
│ user_id (FK, UNIQUE) │
│ password_hash        │
│ updated_at           │
└──────────────────────┘

         │ 1
         │
         │ *
         ▼
┌──────────────────────┐
│ PasswordResetToken   │
│ ──────────────────── │
│ id (PK)              │
│ user_id (FK)         │
│ token (UNIQUE)       │
│ expires_at           │
│ used                 │
└──────────────────────┘

         │ 1
         │
         │ *
         ▼
┌──────────────────────┐
│      Session         │
│ ──────────────────── │
│ id (PK)              │
│ user_id (FK)         │
│ session_token        │
│ auth_method          │
│ expires_at           │
└──────────────────────┘
```

## State Transitions

### User Account State

```
[No Account] ──register (email/password)──> [Active - Password Auth]
                                                     │
[No Account] ──register (Google OAuth)───> [Active - OAuth Auth]
                                                     │
                                                     │
      ┌──────────────────────────────────────────────┤
      │                                              │
      │ link Google                                  │ set password
      │                                              │
      ▼                                              ▼
[Active - Both Auth Methods]                 [Active - Both Auth Methods]
      │                                              │
      │ unlink Google (if password set)              │ unlink password (future)
      │                                              │
      ▼                                              ▼
[Active - Password Auth]                     [Active - OAuth Auth]
```

### Session State

```
[No Session] ──login success──> [Active Session]
                                       │
                                       │ 30 days or logout
                                       │
                                       ▼
                                 [Expired/Ended]
```

### Password Reset State

```
[No Token] ──request reset──> [Token Created (valid 24h)]
                                       │
                                       │ click link
                                       │
                                       ▼
                              [Token Used - Password Updated]
                                       │
                                       │ cleanup
                                       │
                                       ▼
                                 [Token Deleted]
```

## Database Migrations

### Migration 1: Create Users Table

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('client', 'provider', 'admin');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  image VARCHAR(500),
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Migration 2: Create Accounts Table (OAuth)

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider_account ON accounts(provider, provider_account_id);
```

### Migration 3: Create Password Credentials Table

```sql
CREATE TABLE password_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_cred_user_id ON password_credentials(user_id);
```

### Migration 4: Create Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_user_expires ON password_reset_tokens(user_id, expires_at);
```

### Migration 5: Create Sessions Table (Optional)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  auth_method VARCHAR(20) NOT NULL CHECK (auth_method IN ('password', 'google')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_session_token ON sessions(session_token);
CREATE INDEX idx_session_user_expires ON sessions(user_id, expires_at);
```

## Validation Summary

### User Entity
- Email: Valid format, unique
- Name: 2-100 chars
- Phone: Valid format (E.164 recommended)
- Role: Enum constraint

### Account Entity
- Provider: Currently 'google' only
- provider_account_id: Required, unique per provider

### PasswordCredential Entity
- password_hash: bcrypt format, never plain text
- One per user

### PasswordResetToken Entity
- Token: 32+ chars, URL-safe, unique
- expires_at: 24 hours max
- Only one valid token per user

### Session Entity
- session_token: Unique JWT or opaque token
- expires_at: 30 days max
- auth_method: Enum constraint

## Security Considerations

1. **Password Storage**: Always bcrypt with ≥10 salt rounds
2. **Token Encryption**: Encrypt OAuth refresh/access tokens at rest
3. **Email Verification**: Optional but recommended for production
4. **Rate Limiting**: Track login attempts per IP (10/hour)
5. **Session Cleanup**: Periodically delete expired sessions/tokens
6. **Audit Trail**: Log authentication events (login, logout, password change)
7. **GDPR Compliance**: Support user data export/deletion (CASCADE deletes)

## Notes

- **Simplified Design**: PasswordCredential can be merged into User table as nullable `password_hash` column
- **Session Tracking**: Optional if using stateless JWT; enable for "view active devices" feature
- **Rate Limiting**: Consider in-memory (Redis) vs. database for performance
- **Email Verification**: Not in initial scope but schema supports it (email_verified field)
- **Future Providers**: Schema supports multiple OAuth providers (Facebook, Apple, etc.)
