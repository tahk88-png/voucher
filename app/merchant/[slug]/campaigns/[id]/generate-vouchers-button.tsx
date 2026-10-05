'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';
import { formatPrice } from '@/lib/currency-constants';
import { normalizeCurrency } from '@/lib/money-input';
import { DISPLAY_LOCALE, formatDisplayDate } from '@/lib/voucher-display';
import { isSupportedLocale, localeToIntlLocale } from '@/lib/locale-config';

interface GenerateVouchersButtonProps {
  campaignId: string;
  merchantSlug: string;
  campaign: {
    name: string;
    startDate: string;
    endDate: string;
    price: number | null;
    merchant?: { defaultCurrency: string };
  };
}

export default function GenerateVouchersButton({
  campaignId,
  merchantSlug,
  campaign,
}: GenerateVouchersButtonProps) {
  const router = useRouter();
  const t = useTranslations('merchantCampaigns');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const dateLocale = isSupportedLocale(locale) ? localeToIntlLocale[locale] : DISPLAY_LOCALE;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState('1');
  const currency = normalizeCurrency(campaign.merchant?.defaultCurrency);
  const hasPrice = campaign.price !== null && campaign.price > 0;
  const valueLabel = hasPrice ? formatPrice(campaign.price as number, currency, 'en-GB') : null;

  const handleGenerate = async () => {
    if (!/^\d+$/.test(count) || parseInt(count, 10) < 1 || parseInt(count, 10) > 100) {
      showError(t('generate.invalidCount'), tCommon('error'));
      return;
    }
    if (!hasPrice) {
      showError(t('generate.needsPrice'), tCommon('error'));
      return;
    }

    setIsLoading(true);
    try {
      // Generate vouchers with campaign defaults
      const res = await fetch(`/api/campaigns/${campaignId}/generate-vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(count, 10),
          voucherData: {
            type: 'fixed_amount',
            value: campaign.price,
            currency,
            validFrom: campaign.startDate,
            validTo: campaign.endDate,
            codePrefix: campaign.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || undefined,
            designJson: { headline: campaign.name },
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(apiErrorMessage(error, t('generate.failed')));
      }

      const result = await res.json();
      const n = Number(result.count) || 0;
      showSuccess(t('generate.success', { count: n }), tCommon('success'));
      setIsOpen(false);
      router.refresh(); // Refresh to show new vouchers
    } catch (error) {
      showError(error instanceof Error ? error.message : t('generate.failed'), tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <WarmButton onClick={() => setIsOpen(true)} size="sm">
        {t('generate.open')}
      </WarmButton>
    );
  }

  return (
    <WarmCard
      padding="lg"
      className="absolute z-10 w-[min(24rem,calc(100vw-2rem))] right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] shadow-warm"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--text)]">{t('generate.title')}</h3>
        <p className="text-xs text-[var(--text-muted)]">
          {hasPrice
            ? t('generate.descriptionPriced', {
                value: valueLabel ?? '',
                start: formatDisplayDate(campaign.startDate, dateLocale),
                end: formatDisplayDate(campaign.endDate, dateLocale),
              })
            : t('generate.descriptionFree')}
        </p>
      </div>
      <div className="space-y-4 mt-4">
        <div>
          <Label htmlFor="count">{t('generate.countLabel')}</Label>
          <Input
            id="count"
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            required
            className="mt-1 border-[var(--border)]"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <WarmButton onClick={() => setIsOpen(false)} variant="outline" size="sm">
            {tCommon('cancel')}
          </WarmButton>
          <WarmButton onClick={handleGenerate} disabled={isLoading || !hasPrice} size="sm">
            {isLoading ? t('generate.generating') : t('generate.submit')}
          </WarmButton>
        </div>
      </div>
    </WarmCard>
  );
}
