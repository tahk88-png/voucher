import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import FacebookProvider from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { hashPassword, verifyPassword } from './passwords';

/**
 * Auth: OAuth providers (when configured) + credentials login against DB passwordHash.
 * JWT sessions with auto-upsert to Prisma DB on sign-in.
 */
const isExplicitlyDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const enableLegacyTestCredentialFallback =
  isExplicitlyDevelopment && process.env.ENABLE_TEST_CREDENTIALS === 'true';

const legacyCredentialProfiles = [
  {
    email: process.env.TEST_USER_EMAIL ?? 'test@example.com',
    password: process.env.TEST_USER_PASSWORD ?? 'test123',
    name: 'Test User',
  },
  {
    email: process.env.TEST_ADMIN_EMAIL ?? 'admin@coffee-house.com',
    password: process.env.TEST_ADMIN_PASSWORD ?? 'admin123',
    name: 'Admin User',
  },
  {
    email: process.env.TEST_STAFF_EMAIL ?? 'staff@coffee-house.com',
    password: process.env.TEST_STAFF_PASSWORD ?? 'staff123',
    name: 'Staff User',
  },
  {
    email: process.env.TEST_TECH_ADMIN_EMAIL ?? 'admin@tech-store.com',
    password: process.env.TEST_TECH_ADMIN_PASSWORD ?? 'techadmin123',
    name: 'Tech Admin',
  },
  {
    email: process.env.TEST_PLATFORM_ADMIN_EMAIL ?? 'platform-admin@gifthub.local',
    password: process.env.TEST_PLATFORM_ADMIN_PASSWORD ?? 'platform123',
    name: 'Platform Admin',
  },
].filter((profile) => Boolean(profile.email) && Boolean(profile.password));

/**
 * Ensure user exists in Prisma DB. Creates if not found, updates name/image if changed.
 * Returns the Prisma user ID (used as session.user.id throughout the app).
 */
async function ensureDbUser(email: string, name?: string | null, image?: string | null) {
  const defaultName = name ?? email.split('@')[0];
  const defaultImage = image ?? null;
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      ...(name ? { name } : {}),
      ...(image ? { image } : {}),
    },
    create: {
      email,
      name: defaultName,
      image: defaultImage,
    },
  });
  return user;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const appleClientId = process.env.APPLE_CLIENT_ID || process.env.APPLE_ID;
const appleClientSecret = process.env.APPLE_CLIENT_SECRET || process.env.APPLE_SECRET;
const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Google OAuth (primary)
    ...(googleClientId && googleClientSecret && googleClientId !== 'change_me'
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    // Apple OAuth
    ...(appleClientId && appleClientSecret && appleClientId !== 'change_me'
      ? [
          AppleProvider({
            clientId: appleClientId,
            clientSecret: appleClientSecret,
          }),
        ]
      : []),
    // Facebook OAuth
    ...(facebookClientId && facebookClientSecret && facebookClientId !== 'change_me'
      ? [
          FacebookProvider({
            clientId: facebookClientId,
            clientSecret: facebookClientSecret,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        magicToken: { label: 'Magic Token', type: 'text' },
      },
      async authorize(credentials) {
        // Magic token flow (after OTP verification)
        if (credentials?.magicToken && credentials?.email && typeof credentials.magicToken === 'string' && typeof credentials.email === 'string') {
          const normalizedEmail = credentials.email.trim().toLowerCase();
          const tokenRecord = await prisma.verificationToken.findFirst({
            where: {
              email: normalizedEmail,
              token: `magic:${credentials.magicToken}`,
              expires: { gt: new Date() },
            },
          });
          if (!tokenRecord) return null;
          await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
          const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          if (!user) return null;
          return { id: user.id, email: user.email, name: user.name, image: user.image ?? undefined };
        }

        if (
          !credentials?.email ||
          typeof credentials.email !== 'string' ||
          !credentials?.password ||
          typeof credentials.password !== 'string'
        ) {
          return null;
        }

        const email = normalizeEmail(credentials.email);
        const password = credentials.password;

        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
          },
        });

        if (existingUser?.passwordHash) {
          const valid = await verifyPassword(password, existingUser.passwordHash);
          if (!valid) {
            return null;
          }

          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            image: existingUser.image ?? undefined,
          };
        }

        if (!enableLegacyTestCredentialFallback) {
          return null;
        }

        const matchedProfile = legacyCredentialProfiles.find(
          (profile) => normalizeEmail(profile.email) === email && profile.password === password
        );

        if (!matchedProfile) {
          return null;
        }

        const passwordHash = await hashPassword(password);
        const dbUser = await prisma.user.upsert({
          where: { email },
          update: {
            name: matchedProfile.name,
            passwordHash,
            emailVerified: new Date(),
          },
          create: {
            email,
            name: matchedProfile.name,
            passwordHash,
            emailVerified: new Date(),
          },
        });

        return { id: dbUser.id, email: dbUser.email, name: dbUser.name };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // On initial sign-in, upsert to DB and store DB user ID
      if (user && user.email) {
        const image = (user as unknown as Record<string, unknown>).image as string | undefined;
        const dbUser = await ensureDbUser(user.email, user.name, image);
        token.sub = dbUser.id;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.picture = dbUser.image ?? image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? '';
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? '';
        session.user.image = typeof token.picture === 'string' ? token.picture : null;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
