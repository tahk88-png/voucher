'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { PLAN_CATALOG, PLATFORM_FEE_PERCENT, TRIAL_DAYS } from '@/lib/access-control/monetization';
import { SUPPORTED_CURRENCIES } from '@/lib/currency-constants';
import { formatWholeCurrency } from '@/components/landing/format-price';

const eur = (cents: number) => formatWholeCurrency(cents, 'EUR');
/** One messages/<locale>.json per UI language. */
const LANGUAGE_COUNT = 25;

// Values interpolated into the answers. Same figures as the pricing section on
// the landing page (lib/access-control/monetization); plan names are brand names.
const FAQ_VALUES = {
  fee: PLATFORM_FEE_PERCENT,
  currencies: SUPPORTED_CURRENCIES.length,
  languages: LANGUAGE_COUNT,
  trialDays: TRIAL_DAYS,
  starter: PLAN_CATALOG.starter.label,
  starterPrice: eur(PLAN_CATALOG.starter.monthlyPriceCents),
  pro: PLAN_CATALOG.pro.label,
  proPrice: eur(PLAN_CATALOG.pro.monthlyPriceCents),
  scale: PLAN_CATALOG.scale.label,
  scalePrice: eur(PLAN_CATALOG.scale.monthlyPriceCents),
};

// Question ids map to faq.items.<id>.q / .a in messages/<locale>.json.
const faqs = [
  { category: 'general', items: ['whatIs', 'isFree', 'countries'] },
  { category: 'purchasing', items: ['howToBuy', 'paymentMethods', 'refund'] },
  { category: 'vouchers', items: ['howToRedeem', 'expiry', 'gift'] },
  { category: 'account', items: ['twoFactor', 'biometrics', 'deleteAccount'] },
  { category: 'merchants', items: ['startSelling', 'fees', 'integrations', 'trackSales'] },
  { category: 'loyalty', items: ['loyalty', 'badges'] },
] as const;

export default function FaqPage() {
  const t = useTranslations('faq');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
        {t('title')}
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
        {t('subtitle')}
      </p>

      <div className="space-y-8">
        {faqs.map((cat) => (
          <section key={cat.category}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
              {t(`categories.${cat.category}`)}
            </h2>
            <div className="space-y-1">
              {cat.items.map((item) => {
                const key = `${cat.category}-${item}`;
                const isOpen = openItems.has(key);
                return (
                  <div
                    key={key}
                    className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors"
                      style={{
                        color: 'var(--text)',
                        backgroundColor: isOpen ? 'var(--surface-dim)' : 'var(--surface)',
                      }}
                    >
                      {t(`items.${item}.q`)}
                      <ChevronDown
                        size={16}
                        className="shrink-0 ml-2 transition-transform"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: 'var(--text-muted)',
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div
                        className="px-4 py-3 text-sm"
                        style={{
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--surface)',
                        }}
                      >
                        {t(`items.${item}.a`, FAQ_VALUES)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
