import { prisma } from '@/lib/prisma';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

const CAMPAIGN_TRIAL_DAYS = 60;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function getMerchantBillingStatus(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { subscription: true },
  });

  if (!merchant) {
    throw new NotFoundError('Merchant not found');
  }

  const now = new Date();
  const subscription = merchant.subscription;
  const trialEndsAt = subscription?.trialEndsAt || addDays(merchant.createdAt, CAMPAIGN_TRIAL_DAYS);
  const inTrial = now < trialEndsAt;
  const status = subscription?.status || 'inactive';
  const active = status === 'active' || status === 'trialing';

  return {
    status,
    active,
    inTrial,
    trialEndsAt,
    currentPeriodEnd: subscription?.currentPeriodEnd || null,
    stripeCustomerId: subscription?.stripeCustomerId || null,
    stripeSubscriptionId: subscription?.stripeSubscriptionId || null,
  };
}

export async function requireCampaignCreationAccess(merchantId: string) {
  const billing = await getMerchantBillingStatus(merchantId);
  if (!billing.active && !billing.inTrial) {
    throw new ForbiddenError('Campaign creation requires an active subscription');
  }
  return billing;
}
