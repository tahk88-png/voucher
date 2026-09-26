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
import { CAMPAIGN_TYPE_HELP } from '@/lib/voucher-display';
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

function parseOptionalPositiveInt(raw: string, label: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const s = raw.trim();
  if (!s) return { ok: true, value: null };
  if (!/^\d+$/.test(s) || Number(s) < 1) return { ok: false, error: `${label} must be a whole number of 1 or more.` };
  return { ok: true, value: Number(s) };
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
  const t = useTranslations();
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

  const pricePreview = parseMoneyToMinor(priceInput, currency, 'Price');
  const creditPreview = parsePercentToBasisPoints(creditInput, 'Referrer credit');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const price = parseMoneyToMinor(priceInput, currency, 'Price');
    if (!price.ok) return showError(price.error);
    const credit = parsePercentToBasisPoints(creditInput, 'Referrer credit');
    if (!credit.ok) return showError(credit.error);
    const maxRedemptions = parseOptionalPositiveInt(String(formData.get('maxRedemptions') ?? ''), 'Max redemptions');
    if (!maxRedemptions.ok) return showError(maxRedemptions.error);
    const maxPurchases = parseOptionalPositiveInt(String(formData.get('maxPurchases') ?? ''), 'Max purchases');
    if (!maxPurchases.ok) return showError(maxPurchases.error);

    // datetime-local values are wall-clock time in the merchant's browser zone.
    const start = new Date(startInput);
    const end = new Date(endInput);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return showError('Please enter a valid start and end date.');
    }
    if (end.getTime() <= start.getTime()) {
      return showError('The end date must be after the start date.');
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
        throw new Error(apiErrorMessage(body, isEdit ? 'Failed to save campaign' : 'Failed to create campaign'));
      }

      if (isEdit) {
        showSuccess('Campaign changes saved.');
        router.push(`/merchant/${merchantSlug}/campaigns/${campaignId}`);
        router.refresh();
      } else {
        showSuccess(t('success.campaignCreated'));
        router.push(`/merchant/${merchantSlug}/campaigns/${body.id}`);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t('success.failedToCreateCampaign'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <WarmCard className="mb-4" padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Basic information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign name *</Label>
              <Input id="name" name="name" required placeholder="Holiday Special" defaultValue={initial?.name ?? ''} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Limited time promotion"
                defaultValue={initial?.description ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                name="type"
                required
                aria-describedby="type-help"
                value={type}
                onChange={(e) => setType(e.target.value as 'weekly' | 'limited')}
                className={selectClass}
              >
                <option value="limited">One-off (limited)</option>
                <option value="weekly">Weekly</option>
              </select>
              <p id="type-help" className="text-xs text-[var(--text-muted)] mt-1">
                {CAMPAIGN_TYPE_HELP[type]}
              </p>
            </div>
          </div>
        </WarmCard>

        <WarmCard className="mb-4" padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Dates</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Start date *</Label>
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
              <Label htmlFor="endDate">End date *</Label>
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
          <p className="text-xs text-[var(--text-muted)] mt-2">Times are in your local time zone.</p>
        </WarmCard>

        <WarmCard className="mb-4" padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Pricing and limits</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Price in {currency} (leave empty for free vouchers)</Label>
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
                  ? pricePreview.error
                  : pricePreview.value !== null
                    ? `Customers pay ${formatPrice(pricePreview.value, currency, 'en-GB')}.`
                    : `Type the amount in ${currency}, e.g. 4.50 or 4,50 for ${exampleAmount(currency, 4.5)}.`}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="maxRedemptions">Max redemptions</Label>
                <Input
                  id="maxRedemptions"
                  name="maxRedemptions"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  defaultValue={initial?.maxRedemptions ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="maxPurchases">Max purchases</Label>
                <Input
                  id="maxPurchases"
                  name="maxPurchases"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  defaultValue={initial?.maxPurchases ?? ''}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="creditPercentage">Referrer credit (%)</Label>
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
                  ? creditPreview.error
                  : creditPreview.value !== null
                    ? `Referrers earn ${basisPointsToInputString(creditPreview.value)}% of the purchase price as credit.`
                    : 'Share of the purchase price paid to the referrer as credit, e.g. 5 or 2,5.'}
              </p>
            </div>
          </div>
        </WarmCard>

        <WarmCard className="mb-4" padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Terms and conditions</h2>
          <Label htmlFor="terms">Terms</Label>
          <textarea
            id="terms"
            name="terms"
            rows={4}
            defaultValue={initial?.terms ?? ''}
            className="w-full px-3 py-2 border rounded-md border-[var(--border)] bg-[var(--surface)]"
            placeholder="Terms and conditions for this campaign..."
          />
        </WarmCard>

        <div className="flex flex-wrap gap-4">
          <WarmButton type="submit" disabled={isLoading}>
            {isEdit ? (isLoading ? 'Saving...' : 'Save changes') : isLoading ? 'Creating...' : 'Create campaign'}
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
            Cancel
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
