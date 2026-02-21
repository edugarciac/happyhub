# Quickstart Guide: Email/Password and Google OAuth Authentication

**Feature**: 001-email-password-auth
**Estimated Implementation Time**: 3-5 days
**Prerequisites**: Node.js 18+, PostgreSQL, Google Cloud Console account

## Overview

This guide walks through implementing dual authentication (email/password + Google OAuth) for HappyHub in the correct dependency order.

## Prerequisites Checklist

- [ ] PostgreSQL database running (local or AWS RDS Aurora)
- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials obtained (Client ID + Secret)
- [ ] HTTPS endpoint available for production (OAuth requirement)
- [ ] Environment variables configured

## Phase 1: Setup & Dependencies (Day 1, ~4 hours)

### 1.1 Install NPM Packages

```bash
# Core authentication
npm install next-auth@^4.24.5 bcryptjs@^2.4.3

# Type definitions
npm install --save-dev @types/bcryptjs

# Already installed (verify):
# - zod (validation)
# - react-hook-form (forms)
# - @types/node, @types/react
```

### 1.2 Configure Google OAuth

**Step 1**: Go to [Google Cloud Console](https://console.cloud.google.com/)

**Step 2**: Create/select project → "APIs & Services" → "Credentials"

**Step 3**: Create OAuth 2.0 Client ID:
- Application type: **Web application**
- Name: **HappyHub Authentication**
- Authorized JavaScript origins:
  - `http://localhost:3000` (development)
  - `https://www.happyhub.es` (production)
- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google` (development)
  - `https://www.happyhub.es/api/auth/callback/google` (production)

**Step 4**: Copy Client ID and Client Secret

### 1.3 Environment Variables

Update `.env`:

```bash
# Existing variables (keep as-is)
DATABASE_URL=postgresql://...
JWT_SECRET=your-existing-jwt-secret
NEXTAUTH_SECRET=your-existing-nextauth-secret  # Or generate new if missing

# New Google OAuth variables
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcd1234efgh5678ijkl

# NextAuth configuration
NEXTAUTH_URL=http://localhost:3000  # Change to https://www.happyhub.es in production
```

Generate secrets if needed:
```bash
# Generate NEXTAUTH_SECRET if not already set
openssl rand -base64 32
```

### 1.4 Database Schema

Run migrations in order:

```bash
# 1. Create users table
psql $DATABASE_URL < specs/001-email-password-auth/migrations/001_create_users_table.sql

# 2. Create accounts table (OAuth)
psql $DATABASE_URL < specs/001-email-password-auth/migrations/002_create_accounts_table.sql

# 3. Create password credentials table
psql $DATABASE_URL < specs/001-email-password-auth/migrations/003_create_password_credentials_table.sql

# 4. Create password reset tokens table
psql $DATABASE_URL < specs/001-email-password-auth/migrations/004_create_password_reset_tokens_table.sql

# 5. Create sessions table (optional)
psql $DATABASE_URL < specs/001-email-password-auth/migrations/005_create_sessions_table.sql
```

Or use migration tool if available (Prisma, Knex, etc.)

---

## Phase 2: Core Backend (Day 2-3, ~12 hours)

### 2.1 Create NextAuth Configuration

**File**: `src/lib/nextauth.ts`

```typescript
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser, linkGoogleAccount } from "@/utils/db/users";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        const user = await getUserByEmail(credentials.email);
        if (!user || !user.passwordHash) {
          throw new Error("Email o contraseña incorrectos");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Email o contraseña incorrectos");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth account linking
      if (account?.provider === "google") {
        const existingUser = await getUserByEmail(user.email!);
        if (existingUser) {
          // Link Google to existing account
          await linkGoogleAccount(existingUser.id, account.providerAccountId);
          return true;
        }
        // New Google sign-up will be handled by NextAuth
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.authMethod = account?.provider === "google" ? "google" : "password";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.authMethod = token.authMethod;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
};

export default NextAuth(authOptions);
```

### 2.2 Create NextAuth API Route

**File**: `src/pages/api/auth/[...nextauth].ts`

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/nextauth";

export default NextAuth(authOptions);
```

### 2.3 Database Helper Functions

**File**: `src/utils/db/users.ts`

```typescript
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  image?: string;
  role: 'client' | 'provider' | 'admin';
  passwordHash?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    `SELECT u.*, pc.password_hash
     FROM users u
     LEFT JOIN password_credentials pc ON u.id = pc.user_id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

export async function createUser(data: {
  email: string;
  name: string;
  phone: string;
  password?: string;
  role?: 'client' | 'provider' | 'admin';
}): Promise<User> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, name, phone, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.email, data.name, data.phone, data.role || 'client']
    );
    const user = userResult.rows[0];

    // Create password credential if provided
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      await client.query(
        `INSERT INTO password_credentials (user_id, password_hash)
         VALUES ($1, $2)`,
        [user.id, passwordHash]
      );
    }

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function linkGoogleAccount(userId: string, googleId: string): Promise<void> {
  await pool.query(
    `INSERT INTO accounts (user_id, type, provider, provider_account_id)
     VALUES ($1, 'oauth', 'google', $2)
     ON CONFLICT (provider, provider_account_id) DO NOTHING`,
    [userId, googleId]
  );
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; phone?: string }
): Promise<User> {
  const result = await pool.query(
    `UPDATE users
     SET name = COALESCE($2, name),
         phone = COALESCE($3, phone),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [userId, data.name, data.phone]
  );
  return result.rows[0];
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO password_credentials (user_id, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET password_hash = $2, updated_at = NOW()`,
    [userId, passwordHash]
  );
}
```

### 2.4 Registration API Route

**File**: `src/pages/api/auth/register.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createUser, getUserByEmail } from '@/utils/db/users';
import { sign } from 'jsonwebtoken';

const registerSchema = z.object({
  email: z.string().email('Por favor, introduce una dirección de email válida'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe contener letras')
    .regex(/[0-9]/, 'La contraseña debe contener números'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Por favor, introduce un número de teléfono válido'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const data = registerSchema.parse(req.body);

    // Check if email already exists
    const existing = await getUserByEmail(data.email);
    if (existing) {
      return res.status(409).json({
        error: 'Este email ya está registrado. Por favor, inicia sesión o usa otro email',
      });
    }

    // Create user
    const user = await createUser(data);

    // Generate JWT
    const token = sign(
      { id: user.id, email: user.email, role: user.role, authMethod: 'password' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        authMethods: { password: true, google: false },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Error al crear la cuenta. Por favor, inténtalo de nuevo' });
  }
}
```

---

## Phase 3: Frontend Components (Day 3-4, ~10 hours)

### 3.1 Registration Page

**File**: `src/pages/register.tsx`

```tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const registerSchema = z.object({
  email: z.string().email('Por favor, introduce una dirección de email válida'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe contener letras')
    .regex(/[0-9]/, 'La contraseña debe contener números'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Número de teléfono inválido'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error al registrarse');
        return;
      }

      // Store JWT token
      localStorage.setItem('token', result.token);
      router.push('/');
    } catch (err) {
      setError('Error de conexión. Por favor, inténtalo de nuevo');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h1 className="text-3xl font-bold text-center">Crear cuenta</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Contraseña</label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Nombre completo</label>
            <input
              {...register('name')}
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+34612345678"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O continúa con</span>
          </div>
        </div>

        <GoogleSignInButton onClick={handleGoogleSignIn} />

        <p className="text-center text-sm">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 3.2 Google Sign-In Button Component

**File**: `src/components/auth/GoogleSignInButton.tsx`

```tsx
export default function GoogleSignInButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className="text-gray-700 font-medium">Continuar con Google</span>
    </button>
  );
}
```

---

## Phase 4: Testing (Day 5, ~6 hours)

### 4.1 Unit Tests

**File**: `__tests__/utils/auth.test.ts`

```typescript
import { createUser, getUserByEmail, setUserPassword } from '@/utils/db/users';
import bcrypt from 'bcryptjs';

describe('User Authentication', () => {
  it('should create user with password', async () => {
    const user = await createUser({
      email: 'test@example.com',
      password: 'SecurePass123',
      name: 'Test User',
      phone: '+34612345678',
    });

    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');

    // Verify password was hashed
    const fetched = await getUserByEmail('test@example.com');
    expect(fetched?.passwordHash).toBeDefined();
    expect(await bcrypt.compare('SecurePass123', fetched!.passwordHash!)).toBe(true);
  });

  it('should prevent duplicate emails', async () => {
    await expect(
      createUser({
        email: 'duplicate@example.com',
        password: 'Pass123',
        name: 'User 1',
        phone: '+34611111111',
      })
    ).resolves.toBeDefined();

    await expect(
      createUser({
        email: 'duplicate@example.com',
        password: 'Pass456',
        name: 'User 2',
        phone: '+34622222222',
      })
    ).rejects.toThrow();
  });
});
```

### 4.2 Manual Testing Checklist

- [ ] **Email/Password Registration**
  - [ ] Valid registration creates account and auto-logs in
  - [ ] Duplicate email shows error
  - [ ] Weak password validation works
  - [ ] Invalid email format rejected

- [ ] **Email/Password Login**
  - [ ] Valid credentials log in successfully
  - [ ] Invalid password shows generic error
  - [ ] Non-existent email shows generic error
  - [ ] Rate limiting works (10 attempts/hour)

- [ ] **Google OAuth Registration**
  - [ ] Google sign-up creates account
  - [ ] Profile info (name, email) auto-filled from Google
  - [ ] Prompted for phone number if not from Google
  - [ ] Duplicate Google account → error

- [ ] **Google OAuth Login**
  - [ ] Existing Google account logs in
  - [ ] Non-registered Google account → prompted to sign up

- [ ] **Account Linking**
  - [ ] Email/password user can link Google
  - [ ] Google user can set password
  - [ ] Both methods work for login after linking
  - [ ] Cannot link Google account already used elsewhere

- [ ] **Password Reset**
  - [ ] Reset email sent for existing accounts
  - [ ] Generic message for non-existent emails
  - [ ] Valid token allows password change
  - [ ] Expired token (>24h) rejected

- [ ] **Session Management**
  - [ ] JWT persists across page navigation
  - [ ] Protected routes redirect to login when not authenticated
  - [ ] Logout clears session
  - [ ] Session expires after 30 days

---

## Common Issues & Solutions

### Issue: "Invalid OAuth callback URL"
**Solution**: Ensure redirect URI in Google Console exactly matches `http://localhost:3000/api/auth/callback/google` (no trailing slash)

### Issue: "NEXTAUTH_URL not set"
**Solution**: Add `NEXTAUTH_URL=http://localhost:3000` to `.env`

### Issue: Database connection error
**Solution**: Verify `DATABASE_URL` is correct and PostgreSQL is running

### Issue: JWT token not persisting
**Solution**: Check localStorage in browser DevTools, verify token is being set after login

### Issue: CORS errors on OAuth callback
**Solution**: Ensure your domain is added to "Authorized JavaScript origins" in Google Console

---

## Production Deployment Checklist

- [ ] Update `NEXTAUTH_URL` to production domain (https://www.happyhub.es)
- [ ] Add production redirect URI to Google Console
- [ ] Generate new `NEXTAUTH_SECRET` for production (never reuse dev secret)
- [ ] Verify HTTPS is enabled (required for OAuth)
- [ ] Test full OAuth flow on production domain
- [ ] Set up monitoring for failed login attempts
- [ ] Configure email service for password resets (n8n or SMTP)
- [ ] Run database migrations on production database
- [ ] Test rate limiting in production
- [ ] Verify JWT expiry (30 days) working correctly

---

## Support & Resources

- **NextAuth.js Docs**: https://next-auth.js.org/
- **Google OAuth Setup**: https://console.cloud.google.com/
- **Spec Document**: [spec.md](spec.md)
- **Data Model**: [data-model.md](data-model.md)
- **API Contracts**: [contracts/auth-api.yaml](contracts/auth-api.yaml)
- **Research Notes**: [research.md](research.md)

---

**Last Updated**: 2026-02-20
**Feature Status**: Ready for implementation
**Next Command**: `/speckit.tasks` to generate implementation tasks
