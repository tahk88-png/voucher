/**
 * Seed billing plans into the BillingPlan table.
 *
 * Run: npx tsx prisma/seed-billing-plans.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    slug: 'starter',
    name: 'Starter',
    priceMonthlyCents: 1900,
    priceYearlyCents: 19000,
    currency: 'EUR',
    features: ['Campaigns', 'Vouchers', 'Team (2 seats)', 'Basic analytics'],
    limits: {
      campaignCreatesPerCycle: 5,
      activeCampaigns: 3,
      voucherCreatesPerCycle: 500,
      teamMembers: 2,
    },
    capabilities: {
      'campaign.create': true,
      'voucher.create': true,
      'team.member.invite': true,
      'promotion.boost': false,
      'analytics.advanced': false,
      'domain.custom': false,
    },
    sortOrder: 0,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_STARTER || null,
    stripePriceIdYearly: null,
  },
  {
    slug: 'pro',
    name: 'Pro',
    priceMonthlyCents: 3900,
    priceYearlyCents: 39000,
    currency: 'EUR',
    features: [
      'Everything in Starter',
      'Promotion boosts',
      'Advanced analytics',
      'Custom domain',
      'Team (10 seats)',
    ],
    limits: {
      campaignCreatesPerCycle: 60,
      activeCampaigns: 25,
      voucherCreatesPerCycle: 5000,
      teamMembers: 10,
    },
    capabilities: {
      'campaign.create': true,
      'voucher.create': true,
      'team.member.invite': true,
      'promotion.boost': true,
      'analytics.advanced': true,
      'domain.custom': true,
    },
    sortOrder: 1,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_PRO || process.env.STRIPE_SUBSCRIPTION_PRICE_ID || null,
    stripePriceIdYearly: null,
  },
  {
    slug: 'scale',
    name: 'Scale',
    priceMonthlyCents: 9900,
    priceYearlyCents: 99000,
    currency: 'EUR',
    features: [
      'Everything in Pro',
      'Unlimited campaigns',
      'Unlimited vouchers',
      'Unlimited team',
      'Priority support',
    ],
    limits: {
      campaignCreatesPerCycle: null,
      activeCampaigns: null,
      voucherCreatesPerCycle: null,
      teamMembers: null,
    },
    capabilities: {
      'campaign.create': true,
      'voucher.create': true,
      'team.member.invite': true,
      'promotion.boost': true,
      'analytics.advanced': true,
      'domain.custom': true,
    },
    sortOrder: 2,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_SCALE || null,
    stripePriceIdYearly: null,
  },
];

async function main() {
  for (const plan of plans) {
    await prisma.billingPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        priceMonthlyCents: plan.priceMonthlyCents,
        priceYearlyCents: plan.priceYearlyCents,
        currency: plan.currency,
        features: plan.features,
        limits: plan.limits,
        capabilities: plan.capabilities,
        sortOrder: plan.sortOrder,
        stripePriceIdMonthly: plan.stripePriceIdMonthly,
        stripePriceIdYearly: plan.stripePriceIdYearly,
      },
      create: {
        slug: plan.slug,
        name: plan.name,
        priceMonthlyCents: plan.priceMonthlyCents,
        priceYearlyCents: plan.priceYearlyCents,
        currency: plan.currency,
        features: plan.features,
        limits: plan.limits,
        capabilities: plan.capabilities,
        sortOrder: plan.sortOrder,
        stripePriceIdMonthly: plan.stripePriceIdMonthly,
        stripePriceIdYearly: plan.stripePriceIdYearly,
      },
    });
    console.log(`Upserted plan: ${plan.slug}`);
  }

  console.log('Billing plans seeded successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
