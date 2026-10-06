'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { parsePaywallResponse, type PaywallDetails } from '@/lib/paywall-utils';
import { apiErrorMessage } from '@/lib/api-error-message';
import {
  basisPointsToInputString,
  minorToInputString,
  parseMoneyToMinor,
  parsePercentToBasisPoints,
  toDatetimeLocalValue,
} from '@/lib/money-input';
import { formatPrice } from '@/lib/currency-constants';
import PaywallModal from '@/components/billing/paywall-modal';
import { exampleAmount } from '../_components/currency-select';

export type CampaignFormInitial = {
  name: string;
  description: string | null;
  type: 'weekly' | 'limited';
  startDate: string; // ISO
  endDate: string; // ISO
  price: number | null; // minor units
  maxRedemptions: number | null;
  maxPurchases: number | null;
  terms: string | null;
  creditPercentage: number | null; // basis points
};


const selectClass = 'w-full h-10 px-3 py-2 border rounded-md border-[var(--border)] bg-[var(--surface)] text-[var(--text)]';

function parseOptionalPositiveInt(raw: string): { ok: true; value: number | null } | { ok: false } {
  const s = raw.trim();
  if (!s) return { ok: true, value: null };
  if (!/^\d+$/.test(s) || Number(s) < 1) return { ok: false };
  return { ok: true, value: Number(s) };
}

// Labels passed to lib/money-input. Its error messages are English sentences
// built from the label; parseErrorKind maps them back so the form can show
// them in the user's language.
export const PRICE_LABEL = 'Price';
export const CREDIT_LABEL = 'Referrer credit';

type ParseErrorKind = 'negative' | 'invalid' | 'wholeNumber' | 'decimals' | 'tooLarge' | 'tooHigh';

export function parseErrorKind(error: string, label: string): { kind: ParseErrorKind; decimals: number } | null {
  if (error === `${label} can't be negative.`) return { kind: 'negative', decimals: 0 };
  if (error === `${label} isn't a valid number.`) return { kind: 'invalid', decimals: 0 };
  if (error === `${label} must be a whole number.`) return { kind: 'wholeNumber', decimals: 0 };
  if (error === `${label} is too large.`) return { kind: 'tooLarge', decimals: 0 };
  if (error === `${label} can't be more than 100%.`) return { kind: 'tooHigh', decimals: 0 };
  if (error.startsWith(`${label} can have at most `)) {
    const match = /at most (\d+) decimal places\.$/.exec(error);
    if (match) return { kind: 'decimals', decimals: Number(match[1]) };
  }
  return null;
}

export default function CampaignForm({
  merchantSlug,
  currency,
  campaignId,
  initial,
}: {
  merchantSlug: string;
  currency: string;
  /** When set, the form edits this campaign (PUT) instead of creating one. */
  campaignId?: string;
  initial?: CampaignFormInitial;
}) {
  const router = useRouter();
  const t = useTranslations('merchantCampaigns');
  const tShared = useTranslations();
  const isEdit = Boolean(campaignId);
  const [isLoading, setIsLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallData, setPaywallData] = useState<PaywallDetails | null>(null);
  const [type, setType] = useState<'weekly' | 'limited'>(initial?.type ?? 'limited');
  const [priceInput, setPriceInput] = useState(minorToInputString(initial?.price ?? null, currency));
  const [creditInput, setCreditInput] = useState(basisPointsToInputString(initial?.creditPercentage ?? null));
  const [startInput, setStartInput] = useState(
    toDatetimeLocalValue(initial ? new Date(initial.startDate) : new Date()),
  );
  const [endInput, setEndInput] = useState(
    toDatetimeLocalValue(initial ? new Date(initial.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  );

  const pricePreview = parseMoneyToMinor(priceInput, currency, PRICE_LABEL);
  const creditPreview = parsePercentToBasisPoints(creditInput, CREDIT_LABEL);

  /** Translated message for a lib/money-input error; unknown errors are shown as they are. */
  const parseErrorMessage = (field: 'price' | 'credit', error: string): string => {
    const parsed = parseErrorKind(error, field === 'price' ? PRICE_LABEL : CREDIT_LABEL);
    if (!parsed) return error;
    const key = `form.${field}Errors.${parsed.kind}`;
    return t.has(key) ? t(key, { decimals: parsed.decimals }) : error;
  };
  const errorTitle = tShared('common.error');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const price = parseMoneyToMinor(priceInput, currency, PRICE_LABEL);
    if (!price.ok) return showError(parseErrorMessage('price', price.error), errorTitle);
    const credit = parsePercentToBasisPoints(creditInput, CREDIT_LABEL);
    if (!credit.ok) return showError(parseErrorMessage('credit', credit.error), errorTitle);
    const maxRedemptions = parseOptionalPositiveInt(String(formData.get('maxRedemptions') ?? ''));
    if (!maxRedemptions.ok) return showError(t('form.errors.maxRedemptions'), errorTitle);
    const maxPurchases = parseOptionalPositiveInt(String(formData.get('maxPurchases') ?? ''));
    if (!maxPurchases.ok) return showError(t('form.errors.maxPurchases'), errorTitle);

    // datetime-local values are wall-clock time in the merchant's browser zone.
    const start = new Date(startInput);
    const end = new Date(endInput);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return showError(t('form.errors.invalidDates'), errorTitle);
    }
    if (end.getTime() <= start.getTime()) {
      return showError(t('form.errors.endBeforeStart'), errorTitle);
    }

    const data = {
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? ''),
      type,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      price: price.value,
      maxRedemptions: maxRedemptions.value,
      maxPurchases: maxPurchases.value,
      terms: String(formData.get('terms') ?? ''),
      creditPercentage: credit.value,
    };

    setIsLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/campaigns/${campaignId}` : `/api/merchant/${merchantSlug}/campaigns`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) {
          setPaywallData(parsePaywallResponse(body));
          setPaywallOpen(true);
          return;
        }
        throw new Error(
          apiErrorMessage(body, isEdit ? t('form.errors.saveFailed') : tShared('success.failedToCreateCampaign')),
        );
      }

      if (isEdit) {
        showSuccess(t('form.saved'), tShared('common.success'));
        router.push(`/merchant/${merchantSlug}/campaigns/${campaignId}`);
        router.refresh();
      } else {
        showSuccess(tShared('success.campaignCreated'), tShared('common.success'));
        router.push(`/merchant/${merchantSlug}/campaigns/${body.id}`);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : tShared('success.failedToCreateCampaign'), errorTitle);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <WarmCard className="mb-4" padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('form.basicInfo')}</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('form.nameLabel')}</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder={t('form.namePlaceholder')}
                defaultValue={initial?.name ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="description">{t('form.descriptionLabel')}</Label>
              <Input
                id="description"
                name="description"
                placeholder={t('form.descriptionPlaceholder')}
                defaultValue={initial?.description ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="type">{t('form.typeLabel')}</Label>
              <select
                id="type"
                name="type"
                required
                aria-describedby="type-help"
                value={type}
                onChange={(e) => setType(e.target.value as 'weekly' | 'limited')}
                className={selectClass}
              >
                <option value="limited">{t('form.typeOptions.limited')}</option>
                <option value="weekly">{t('form.typeOptions.weekly')}</option>
              </select>
              <p id="type-help" className="text-xs text-[var(--text-muted)] mt-1">
                {tShared(`labels.campaignTypeHelp.${type}`)}
              </p>
            </div>
          </div>
        </WarmCard>

        <WarmCard className="mb-4" padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('form.dates')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDate">{t('form.startDate')}</Label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                required
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">{t('form.endDate')}</Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                required
                min={startInput || undefined}
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">{t('form.timezoneHint')}</p>
        </WarmCard>

        <WarmCard className="mb-4" padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('form.pricing')}</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">{t('form.priceLabel', { currency })}</Label>
              <Input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                aria-invalid={!pricePreview.ok}
              />
              <p className={`text-xs mt-1 ${pricePreview.ok ? 'text-[var(--text-muted)]' : 'text-[var(--danger)]'}`}>
                {!pricePreview.ok
                  ? parseErrorMessage('price', pricePreview.error)
                  : pricePreview.value !== null
                    ? t('form.pricePreview', { price: formatPrice(pricePreview.value, currency, 'en-GB') })
                    : t('form.priceHint', { currency, example: exampleAmount(currency, 4.5) })}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="maxRedemptions">{t('form.maxRedemptions')}</Label>
                <Input
                  id="maxRedemptions"
                  name="maxRedemptions"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={t('form.unlimited')}
                  defaultValue={initial?.maxRedemptions ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="maxPurchases">{t('form.maxPurchases')}</Label>
                <Input
                  id="maxPurchases"
                  name="maxPurchases"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={t('form.unlimited')}
                  defaultValue={initial?.maxPurchases ?? ''}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="creditPercentage">{t('form.creditLabel')}</Label>
              <Input
                id="creditPercentage"
                name="creditPercentage"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="5"
                value={creditInput}
                onChange={(e) => setCreditInput(e.target.value)}
                aria-invalid={!creditPreview.ok}
              />
              <p className={`text-xs mt-1 ${creditPreview.ok ? 'text-[var(--text-muted)]' : 'text-[var(--danger)]'}`}>
                {!creditPreview.ok
                  ? parseErrorMessage('credit', creditPreview.error)
                  : creditPreview.value !== null
                    ? t('form.creditPreview', { percent: basisPointsToInputString(creditPreview.value) })
                    : t('form.creditHint')}
              </p>
            </div>
          </div>
        </WarmCard>

        <WarmCard className="mb-4" padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('form.termsSection')}</h2>
          <Label htmlFor="terms">{t('form.termsLabel')}</Label>
          <textarea
            id="terms"
            name="terms"
            rows={4}
            defaultValue={initial?.terms ?? ''}
            className="w-full px-3 py-2 border rounded-md border-[var(--border)] bg-[var(--surface)]"
            placeholder={t('form.termsPlaceholder')}
          />
        </WarmCard>

        <div className="flex flex-wrap gap-4">
          <WarmButton type="submit" disabled={isLoading}>
            {isEdit
              ? isLoading
                ? t('form.saving')
                : t('form.saveChanges')
              : isLoading
                ? t('form.creating')
                : t('form.create')}
          </WarmButton>
          <WarmButton
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                isEdit ? `/merchant/${merchantSlug}/campaigns/${campaignId}` : `/merchant/${merchantSlug}/campaigns`,
              )
            }
          >
            {tShared('common.cancel')}
          </WarmButton>
        </div>
      </form>

      {paywallData && (
        <PaywallModal
          open={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          slug={merchantSlug}
          message={paywallData.message}
          currentTier={paywallData.planTier}
          requiredPlan={paywallData.requiredPlan}
          capability={paywallData.capability}
          limit={paywallData.limit}
        />
      )}
    </>
  );
}
