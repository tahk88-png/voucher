/**
 * tRPC server initialization.
 *
 * This is used for internal API calls (type-safe, no REST overhead).
 * External/public API remains REST/OpenAPI.
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import superjson from 'superjson';

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type AppSession = {
  user: SessionUser;
} | null;

export type TRPCContext = {
  prisma: typeof prisma;
  session: AppSession;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await auth();
  const appSession: AppSession = session?.user?.id
    ? { user: { id: session.user.id, email: session.user.email, name: session.user.name, image: session.user.image } }
    : null;
  return { prisma, session: appSession };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Protected procedure — requires authenticated session.
 */
const enforceAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.session.user.id,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
