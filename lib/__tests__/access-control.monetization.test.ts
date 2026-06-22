import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { evaluateEntitlement, resolveBilling, resolvePlanTierFromPriceId } from '@/lib/access-control/monetization';

const originalEnv = {
  STRIPE_PRICE_ID_STARTER: process.env.STRIPE_PRICE_ID_STARTER,
  STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO,
  STRIPE_PRICE_ID_SCALE: process.env.STRIPE_PRICE_ID_SCALE,
  STRIPE_SUBSCRIPTION_PRICE_ID: process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
};

const baseUsage = {
  campaignsCreatedInCycle: 0,
  activeCampaigns: 0,
  vouchersCreatedInCycle: 0,
  teamMembers: 1,
};

describe('access-control monetization', () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_ID_STARTER = 'price_starter';
    process.env.STRIPE_PRICE_ID_PRO = 'price_pro';
    process.env.STRIPE_PRICE_ID_SCALE = 'price_scale';
    process.env.STRIPE_SUBSCRIPTION_PRICE_ID = 'price_pro_legacy';
  });

  afterEach(() => {
    process.env.STRIPE_PRICE_ID_STARTER = originalEnv.STRIPE_PRICE_ID_STARTER;
    process.env.STRIPE_PRICE_ID_PRO = originalEnv.STRIPE_PRICE_ID_PRO;
    process.env.STRIPE_PRICE_ID_SCALE = originalEnv.STRIPE_PRICE_ID_SCALE;
    process.env.STRIPE_SUBSCRIPTION_PRICE_ID = originalEnv.STRIPE_SUBSCRIPTION_PRICE_ID;
  });

  it('keeps merchant in trial during 14-day free-trial window', () => {
    const billing = resolveBilling(
      {
        createdAt: new Date('2026-01-01T00:00:00Z'),
        subscriptionStatus: 'inactive',
        subscriptionPriceId: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
      },
      new Date('2026-01-10T00:00:00Z')
    );

    expect(billing.billingState).toBe('trial');
    expect(billing.planTier).toBe('pro');
  });

  it('hard blocks after 14-day trial expires', () => {
    const billing = resolveBilling(
      {
        createdAt: new Date('2026-01-01T00:00:00Z'),
        subscriptionStatus: 'inactive',
        subscriptionPriceId: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
      },
      new Date('2026-01-20T00:00:00Z')
    );

    expect(billing.billingState).toBe('locked');
  });

  it('hard blocks entitlement after trial expires without paid subscription', () => {
    const decision = evaluateEntitlement(
      'campaign.create',
      {
        createdAt: new Date('2026-01-01T00:00:00Z'),
        subscriptionStatus: 'inactive',
        subscriptionPriceId: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
      },
      baseUsage,
      '/merchant/acme/settings?upgrade=campaign.create',
      new Date('2026-01-20T00:00:00Z')
    );

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('PAYWALL_SUBSCRIPTION_REQUIRED');
    expect(decision.requiredPlan).toBe('starter');
  });

  it('requires plan upgrade when capability is not included in current plan', () => {
    const decision = evaluateEntitlement(
      'analytics.advanced',
      {
        createdAt: new Date('2026-01-01T00:00:00Z'),
        subscriptionStatus: 'active',
        subscriptionPriceId: 'price_starter',
        trialEndsAt: null,
        currentPeriodEnd: new Date('2026-02-01T00:00:00Z'),
      },
      baseUsage,
      '/merchant/acme/settings?upgrade=analytics.advanced',
      new Date('2026-03-01T00:00:00Z')
    );

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('PAYWALL_PLAN_UPGRADE_REQUIRED');
    expect(decision.requiredPlan).toBe('pro');
  });

  it('enforces usage limits for campaign creation on pro plan', () => {
    const decision = evaluateEntitlement(
      'campaign.create',
      {
        createdAt: new Date('2026-01-01T00:00:00Z'),
        subscriptionStatus: 'active',
        subscriptionPriceId: 'price_pro',
        trialEndsAt: null,
        currentPeriodEnd: new Date('2026-03-31T00:00:00Z'),
      },
      {
        ...baseUsage,
        campaignsCreatedInCycle: 60,
      },
      '/merchant/acme/settings?upgrade=campaign.create',
      new Date('2026-03-15T00:00:00Z')
    );

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('PAYWALL_LIMIT_REACHED');
    expect(decision.limit?.key).toBe('campaignCreatesPerCycle');
    expect(decision.limit?.max).toBe(60);
  });

  it('allows scale plan for unlimited campaign creation', () => {
    const decision = evaluateEntitlement(
      'campaign.create',
      {
        createdAt: new Date('2026-01-01T00:00:00Z'),
        subscriptionStatus: 'active',
        subscriptionPriceId: 'price_scale',
        trialEndsAt: null,
        currentPeriodEnd: new Date('2026-04-30T00:00:00Z'),
      },
      {
        campaignsCreatedInCycle: 10000,
        activeCampaigns: 10000,
        vouchersCreatedInCycle: 10000,
        teamMembers: 1000,
      },
      '/merchant/acme/settings?upgrade=campaign.create',
      new Date('2026-04-20T00:00:00Z')
    );

    expect(decision.allowed).toBe(true);
    expect(decision.planTier).toBe('scale');
  });

  // ── Regression: plan-tier default must be the LOWEST tier, not 'pro' ──
  // A null/unmatched price ID must never resolve to a paid tier, or an
  // active subscriber with misconfigured STRIPE_PRICE_ID_* env gets paid
  // features free.
  describe('resolvePlanTierFromPriceId default safety', () => {
    it('maps null price to starter (never pro)', () => {
      expect(resolvePlanTierFromPriceId(null)).toBe('starter');
    });

    it('maps an unmatched price to starter (never pro)', () => {
      expect(resolvePlanTierFromPriceId('price_does_not_exist')).toBe('starter');
    });

    it('maps configured price IDs to their tiers', () => {
      expect(resolvePlanTierFromPriceId('price_starter')).toBe('starter');
      expect(resolvePlanTierFromPriceId('price_pro')).toBe('pro');
      expect(resolvePlanTierFromPriceId('price_scale')).toBe('scale');
      expect(resolvePlanTierFromPriceId('price_pro_legacy')).toBe('pro');
    });

    it('resolveBilling gives an active sub with an unmatched price the lowest tier', () => {
      const billing = resolveBilling(
        {
          createdAt: new Date('2026-01-01T00:00:00Z'),
          subscriptionStatus: 'active',
          subscriptionPriceId: 'price_garbage_unmatched',
          trialEndsAt: null,
          currentPeriodEnd: new Date('2026-04-30T00:00:00Z'),
        },
        new Date('2026-03-01T00:00:00Z'), // past trial
      );
      expect(billing.billingState).toBe('active');
      expect(billing.planTier).toBe('starter');
    });
  });

  // ── Regression: activeCampaigns cap (the activation-gate's logic) ──
  // requireCampaignActivationAccess zeroes campaignsCreatedInCycle and
  // relies on evaluateEntitlement firing the activeCampaigns limit. Lock
  // that in: a starter merchant under the per-cycle create quota but at the
  // active-campaign cap must be blocked when activating another.
  it('blocks activating beyond the activeCampaigns cap even with create quota left', () => {
    const decision = evaluateEntitlement(
      'campaign.create',
      {
        createdAt: new Date('2026-01-01T00:00:00Z'),
        subscriptionStatus: 'active',
        subscriptionPriceId: 'price_starter',
        trialEndsAt: null,
        currentPeriodEnd: new Date('2026-04-30T00:00:00Z'),
      },
      {
        ...baseUsage,
        campaignsCreatedInCycle: 0, // create quota untouched (activation path)
        activeCampaigns: 3, // starter cap is 3
      },
      '/merchant/acme/settings?upgrade=campaign.create',
      new Date('2026-03-01T00:00:00Z'),
    );

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('PAYWALL_LIMIT_REACHED');
    expect(decision.limit?.key).toBe('activeCampaigns');
    expect(decision.limit?.max).toBe(3);
  });
});
