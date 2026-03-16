'use client';

import { useState } from 'react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { CreditCard, CheckCircle } from 'lucide-react';

type PlanType = '3x' | '6x' | '12x';

interface PlanOption {
  plan: PlanType;
  months: number;
  interestRate: number;
  monthlyAmountCents: number;
  totalWithInterestCents: number;
  totalInterestCents: number;
  label: string;
}

interface BnplSelectorProps {
  totalCents: number;
  currency: string;
  onSelect: (plan: PlanType) => void;
  loading?: boolean;
}

function calculatePlans(totalCents: number): PlanOption[] {
  const configs: { plan: PlanType; months: number; interestRate: number }[] = [
    { plan: '3x', months: 3, interestRate: 0 },
    { plan: '6x', months: 6, interestRate: 2.5 },
    { plan: '12x', months: 12, interestRate: 5 },
  ];

  return configs.map(({ plan, months, interestRate }) => {
    const totalWithInterestCents = Math.round(totalCents * (1 + interestRate / 100));
    const totalInterestCents = totalWithInterestCents - totalCents;
    const monthlyAmountCents = Math.ceil(totalWithInterestCents / months);

    return {
      plan,
      months,
      interestRate,
      monthlyAmountCents,
      totalWithInterestCents,
      totalInterestCents,
      label:
        interestRate === 0
          ? `${months}x (0% interest)`
          : `${months}x (${interestRate}% fee)`,
    };
  });
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function BnplSelector({
  totalCents,
  currency,
  onSelect,
  loading = false,
}: BnplSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const plans = calculatePlans(totalCents);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="h-5 w-5 text-[var(--primary)]" />
        <h3 className="text-base font-semibold text-[var(--text)]">
          Pay in installments
        </h3>
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Split your payment of {formatCurrency(totalCents, currency)} into easy monthly installments.
      </p>

      <div className="grid gap-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.plan;
          return (
            <button
              key={plan.plan}
              onClick={() => setSelectedPlan(plan.plan)}
              className={`relative w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[var(--primary)] bg-[#FFF9ED]'
                  : 'border-[var(--border)] bg-white hover:border-[var(--primary)] hover:bg-[#FFFDF8]'
              }`}
            >
              {isSelected && (
                <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-[var(--primary)]" />
              )}
              <div className="flex items-baseline justify-between pr-8">
                <div>
                  <span className="text-lg font-bold text-[var(--text)]">
                    {formatCurrency(plan.monthlyAmountCents, currency)}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]"> /month</span>
                </div>
                <span className="text-sm font-medium text-[var(--text)]">
                  {plan.label}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span>{plan.months} monthly payments</span>
                {plan.totalInterestCents > 0 && (
                  <span>
                    Total: {formatCurrency(plan.totalWithInterestCents, currency)}
                  </span>
                )}
                {plan.interestRate === 0 && (
                  <span className="text-green-600 font-medium">No extra cost</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedPlan && (
        <WarmButton
          onClick={() => onSelect(selectedPlan)}
          disabled={loading}
          className="w-full"
        >
          {loading
            ? 'Processing...'
            : `Pay ${formatCurrency(
                plans.find((p) => p.plan === selectedPlan)!.monthlyAmountCents,
                currency
              )} now`}
        </WarmButton>
      )}
    </div>
  );
}
