import { NextAuthOptions, AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword, getUserByEmail, createUser } from '../utils/db/users';

const providers: AuthOptions['providers'] = [
  CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        const user = await verifyPassword(credentials.email, credentials.password);

        if (!user) {
          throw new Error('Email o contraseña incorrectos');
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
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
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user already exists
          const existingUser = await getUserByEmail(user.email);

          if (!existingUser) {
            // Create new user from Google profile
            await createUser({
              email: user.email,
              password: Math.random().toString(36), // Random password for OAuth users
              name: user.name || 'Usuario',
              phone: '', // Optional, can be filled later
              role: 'client',
            });
          }
        } catch (error) {
          console.error('Error in Google sign-in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'client';
        token.authMethod = account?.provider === 'google' ? 'google' : 'password';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).authMethod = token.authMethod;
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
