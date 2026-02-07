import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import FacebookProvider from 'next-auth/providers/facebook';
import GitHubProvider from 'next-auth/providers/github';
import TwitterProvider from 'next-auth/providers/twitter';
import LinkedInProvider from 'next-auth/providers/linkedin';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';

/**
 * IMPORTANT: Test credentials are ONLY enabled when ALL of these conditions are met:
 * 1. NODE_ENV is explicitly set to 'development' or 'test'
 * 2. ENABLE_TEST_CREDENTIALS is explicitly set to 'true'
 * 3. Required test credential environment variables are provided
 *
 * This triple-check ensures test credentials can never accidentally work in production.
 */
const isExplicitlyDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const testCredentialsExplicitlyEnabled = process.env.ENABLE_TEST_CREDENTIALS === 'true';
const testEmail = process.env.TEST_USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD;
const testAdminEmail = process.env.TEST_ADMIN_EMAIL;
const testAdminPassword = process.env.TEST_ADMIN_PASSWORD;

const enableTestCredentials =
  isExplicitlyDevelopment &&
  testCredentialsExplicitlyEnabled &&
  Boolean((testEmail && testPassword) || (testAdminEmail && testAdminPassword));

// Log warning if test credentials are enabled (never in production)
if (enableTestCredentials && isExplicitlyDevelopment) {
  console.warn('⚠️  WARNING: Test credentials are ENABLED. This is only safe in development.');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(enableTestCredentials
      ? [
          Credentials({
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              if (
                !credentials?.email ||
                typeof credentials.email !== 'string' ||
                !credentials?.password ||
                typeof credentials.password !== 'string'
              )
                return null;
              const isUserMatch =
                Boolean(testEmail && testPassword) &&
                credentials.email === testEmail &&
                credentials.password === testPassword;
              const isAdminMatch =
                Boolean(testAdminEmail && testAdminPassword) &&
                credentials.email === testAdminEmail &&
                credentials.password === testAdminPassword;
              if (!isUserMatch && !isAdminMatch) return null;

              const email = (isAdminMatch ? testAdminEmail : testEmail) as string;
              const name = isAdminMatch ? 'Admin User' : 'Test User';
              let user = await prisma.user.findUnique({ where: { email } });
              if (!user) {
                user = await prisma.user.create({ data: { email, name } });
              }
              return { id: user.id, email: user.email, name: user.name ?? name };
            },
          }),
        ]
      : []),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        from: process.env.SMTP_FROM || 'noreply@voucher-platform.com',
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? [
          AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET
      ? [
          TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [
          LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verifyRequest=true',
  },
  callbacks: {
    async session({ session, user, token }) {
      // Support both database and JWT strategies
      if (user) {
        // Database strategy
        session.user.id = user.id;
      } else if (token?.sub) {
        // JWT strategy
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt', // Required for Credentials provider; OAuth still uses adapter for User/Account
  },
});
