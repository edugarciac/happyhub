import { NextAuthOptions, AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword, getUserByEmail, createUser } from '../utils/db/users';
import { ensureUsersTable } from './db';
import { linkParticipantsToUser } from '../utils/db/collaborative-events';
import { recordAuditEvent } from './audit';

const providers: AuthOptions['providers'] = [
  CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const audit = (outcome: 'success' | 'failure', reason: string, userId?: number) =>
          recordAuditEvent(req?.headers as any, { eventType: 'auth.login', outcome, reason, email: credentials?.email, userId });

        if (!credentials?.email || !credentials?.password) {
          await audit('failure', 'missing_credentials');
          throw new Error('Email y contraseña son requeridos');
        }

        let user;
        try {
          await ensureUsersTable();
          user = await verifyPassword(credentials.email, credentials.password);
        } catch (err: any) {
          await audit('failure', `error: ${err?.message || err}`);
          throw err;
        }

        if (!user) {
          // Distingue "no existe" de "contraseña incorrecta" solo en el registro, nunca al usuario
          const exists = await getUserByEmail(credentials.email).catch(() => null);
          await audit('failure', exists ? 'bad_password' : 'unknown_email');
          throw new Error('Email o contraseña incorrectos');
        }

        if (!user.email_verified) {
          await audit('failure', 'email_not_verified', user.id);
          throw new Error('Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
        }

        await audit('success', 'ok', user.id);

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.email_verified,
        };
      },
    }),
];

// Only add Google OAuth if explicitly enabled and credentials exist
if (process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true' &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
        // Reduce URL length by limiting scopes
        scope: "openid email profile",
      },
    },
  }));
}

export const authOptions: NextAuthOptions = {
  providers,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[AUTH] signIn callback:', { provider: account?.provider, email: user.email });

      try {
        await ensureUsersTable();
      } catch (err) {
        console.error('[AUTH] ensureUsersTable failed:', err);
        return false;
      }

      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && user.email) {
        try {
          const existingUser = await getUserByEmail(user.email);
          console.log('[AUTH] Google user lookup:', { email: user.email, found: !!existingUser });

          if (!existingUser) {
            const newUser = await createUser({
              email: user.email,
              password: Math.random().toString(36),
              name: user.name || 'Usuario',
              phone: '',
              role: 'client',
              email_verified: true,
            });
            console.log('[AUTH] Created Google user:', { id: newUser.id, email: newUser.email });
          }
          await recordAuditEvent(undefined, { eventType: 'auth.google', outcome: 'success', reason: existingUser ? 'existing_user' : 'created_user', email: user.email });
        } catch (error: any) {
          console.error('[AUTH] Error in Google sign-in:', error);
          await recordAuditEvent(undefined, { eventType: 'auth.google', outcome: 'failure', reason: `error: ${error?.message || error}`, email: user.email });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'google' && user.email) {
          // For Google OAuth, look up the DB user to get the real DB id
          const dbUser = await getUserByEmail(user.email);
          token.id = dbUser ? dbUser.id.toString() : user.id;
          token.role = dbUser?.role || 'client';
          token.emailVerified = true;
        } else {
          // Credentials login — user.id is already the DB id
          token.id = user.id;
          token.role = (user as any).role || 'client';
          token.emailVerified = (user as any).emailVerified ?? false;
        }
        token.authMethod = account?.provider === 'google' ? 'google' : 'password';

        // Link any pre-existing anonymous/RSVP-only guest rows to this account.
        // `user` is only present on the sign-in request, so this runs once per login.
        const userId = parseInt(token.id as string, 10);
        if (!isNaN(userId) && user.email) {
          try {
            await linkParticipantsToUser(userId, user.email);
          } catch (err) {
            console.error('[AUTH] Failed to link participants on login:', err);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).authMethod = token.authMethod;
        (session.user as any).emailVerified = token.emailVerified ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};
