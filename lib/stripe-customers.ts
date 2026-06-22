import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

/**
 * Reuse-or-create the Stripe Customer for a user, persisting the id back to
 * User.stripeCustomerId so subsequent flows (BNPL installments, box
 * subscriptions, saved payment methods) all resolve to the SAME customer
 * instead of minting a duplicate on every call.
 *
 * Server-only (imports prisma). Returns the Stripe customer id.
 */
export async function getOrCreateStripeCustomerForUser(
  userId: string,
  opts?: { email?: string | null; metadata?: Record<string, string> },
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: opts?.email ?? user?.email ?? undefined,
    metadata: { userId, ...(opts?.metadata ?? {}) },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
