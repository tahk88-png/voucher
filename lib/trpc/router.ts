/**
 * Root tRPC router.
 *
 * Add sub-routers here as features are migrated from REST to tRPC.
 * External API stays REST/OpenAPI. Internal calls use tRPC for type safety.
 */

import { router, publicProcedure, protectedProcedure } from './init';
import { z } from 'zod';

// ─── Example sub-routers (extend as needed) ───

const billingRouter = router({
  /** Get current plan for a merchant. */
  getPlan: protectedProcedure
    .input(z.object({ merchantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.merchantSubscription.findUnique({
        where: { merchantId: input.merchantId },
      });
      return subscription;
    }),

  /** List available billing plans from DB. */
  listPlans: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.billingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }),
});

const userRouter = router({
  /** Get current user profile. */
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        preferredLanguage: true,
        status: true,
        createdAt: true,
      },
    });
  }),
});

// ─── Root router ───

export const appRouter = router({
  billing: billingRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
