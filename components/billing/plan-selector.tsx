'use client';

import { PLAN_CATALOG, type PlanTier } from '@/lib/access-control/monetization';
import { WarmCard } from '@/components/warm-card';
import { StartSubscriptionButton, ManageBillingButton } from '@/components/billing-actions';
import { Check, Zap, Crown, Rocket, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

const PLAN_META: Record<PlanTier, {
  icon: typeof Zap;
  gradient: string;
  features: string[];
}> = {
  starter: {
    icon: Zap,
    gradient: 'from-[#7e9cae] to-[#5e7e92]',
    features: [
      '500 vouchers/month',
      '3 active campaigns',
      '2 team members',
      'QR code redemption',
      'Basic analytics',
    ],
  },
  pro: {
    icon: Crown,
    gradient: 'from-[#cc785c] to-[#b5613f]',
    features: [
      '5,000 vouchers/month',
      '25 active campaigns',
      '10 team members',
      'Advanced analytics',
      'Custom domain',
      'Promo boosts',
    ],
  },
  scale: {
    icon: Rocket,
    gradient: 'from-[#d0a043] to-[#be8a2e]',
    features: [
      'Unlimited vouchers',
      'Unlimited campaigns',
      'Unlimited team members',
      'Everything in Pro',
      'White-label ready',
      'Priority support',
    ],
  },
};

type PlanSelectorProps = {
  slug: string;
  currentTier: PlanTier | null;
  billingState: string;
  hasStripeCustomer: boolean;
};

export default function PlanSelector({ slug, currentTier, billingState, hasStripeCustomer }: PlanSelectorProps) {
  const t = useTranslations('billing');
  const tiers: PlanTier[] = ['starter', 'pro', 'scale'];
  const isActive = billingState === 'active';

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const plan = PLAN_CATALOG[tier];
          const meta = PLAN_META[tier];
          const Icon = meta.icon;
          const isCurrent = isActive && currentTier === tier;
          const isPopular = tier === 'pro';

          return (
            <WarmCard
              key={tier}
              hover={!isCurrent}
              padding="lg"
              className={`relative ${isPopular ? 'border-2 border-[#cc785c] shadow-lg' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#cc785c] to-[#b5613f] text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {t('mostPopular')}
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${meta.gradient} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#2D2721]">{plan.label}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-[#2D2721]">
                    &euro;{plan.monthlyPriceCents / 100}
                  </span>
                  <span className="text-[#8B7355]">{t('perMonth')}</span>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {meta.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isPopular ? 'text-[#cc785c]' : 'text-[#5e7e92]'}`} />
                    <span className="text-sm text-[#2D2721]">{f}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {isCurrent ? (
                  <div className="text-center py-2 px-4 rounded-[var(--r-sm)] bg-[#FAF7F2] text-[#8B7355] font-semibold text-sm">
                    {t('currentPlan')}
                  </div>
                ) : isActive && hasStripeCustomer ? (
                  <ManageBillingButton slug={slug} />
                ) : (
                  <StartSubscriptionButton
                    slug={slug}
                    planTier={tier}
                    label={t('startWith', { plan: plan.label })}
                  />
                )}
              </div>
            </WarmCard>
          );
        })}
      </div>

      <p className="text-center text-sm text-[#8B7355] mt-4">
        {t('trialFooter')}
      </p>
    </div>
  );
}
