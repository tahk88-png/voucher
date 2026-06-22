'use client';

import { PLAN_CATALOG, type PlanTier } from '@/lib/access-control/monetization';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { StartSubscriptionButton, ManageBillingButton } from '@/components/billing-actions';
import { AlertCircle, ArrowUp, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  slug: string;
  message: string;
  currentTier?: string;
  requiredPlan?: string;
  capability?: string;
  limit?: { key: string; current: number; max: number } | null;
  hasStripeCustomer?: boolean;
};

export default function PaywallModal({
  open,
  onClose,
  slug,
  message,
  currentTier,
  requiredPlan,
  limit,
  hasStripeCustomer,
}: PaywallModalProps) {
  const t = useTranslations('billing');
  if (!open) return null;

  const targetTier = (requiredPlan ?? 'pro') as PlanTier;
  const targetPlan = PLAN_CATALOG[targetTier];
  const currentPlan = currentTier ? PLAN_CATALOG[currentTier as PlanTier] : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <WarmCard padding="xl" className="max-w-md w-full relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#FAF7F2] transition-colors"
        >
          <X className="h-5 w-5 text-[#8B7355]" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#cc785c]/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-[#cc785c]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2D2721]">{t('upgradeRequired')}</h3>
            <p className="text-sm text-[#6B5744] mt-1">{message}</p>
          </div>
        </div>

        {limit && (
          <div className="p-3 bg-[#f6e1d7] rounded-[var(--r-sm)] border border-[#cc785c]/30 mb-4">
            <p className="text-sm text-[#2D2721]">
              <span className="font-semibold">{limit.current}</span> / {limit.max} used
              <span className="text-[#8B7355] ml-1">({limit.key.replace(/([A-Z])/g, ' $1').toLowerCase()})</span>
            </p>
          </div>
        )}

        {currentPlan && targetPlan && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-[#FAF7F2] rounded-[var(--r-sm)]">
            <div className="text-center flex-1">
              <p className="text-xs text-[#8B7355]">{t('currentLabel')}</p>
              <p className="font-bold text-[#2D2721]">{currentPlan.label}</p>
              <p className="text-sm text-[#8B7355]">&euro;{currentPlan.monthlyPriceCents / 100}{t('perMonth')}</p>
            </div>
            <ArrowUp className="h-5 w-5 text-[#cc785c] rotate-90" />
            <div className="text-center flex-1">
              <p className="text-xs text-[#8B7355]">{t('recommendedLabel')}</p>
              <p className="font-bold text-[#cc785c]">{targetPlan.label}</p>
              <p className="text-sm text-[#8B7355]">&euro;{targetPlan.monthlyPriceCents / 100}{t('perMonth')}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {hasStripeCustomer ? (
            <div className="flex-1">
              <ManageBillingButton slug={slug} />
            </div>
          ) : (
            <div className="flex-1">
              <StartSubscriptionButton
                slug={slug}
                planTier={targetTier}
                label={t('upgradeButton', { plan: targetPlan?.label ?? 'Pro' })}
              />
            </div>
          )}
          <WarmButton variant="outline" onClick={onClose}>
            {t('laterButton')}
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
