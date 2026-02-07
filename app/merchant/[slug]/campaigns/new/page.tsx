'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { useTranslations } from 'next-intl';

export default function NewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const merchantSlug = params.slug as string;
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();
  const tNav = useTranslations('nav');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as 'weekly' | 'limited',
      startDate: new Date(formData.get('startDate') as string).toISOString(),
      endDate: new Date(formData.get('endDate') as string).toISOString(),
      price: formData.get('price') ? parseInt(formData.get('price') as string) * 100 : null, // Convert to minor units
      maxRedemptions: formData.get('maxRedemptions') ? parseInt(formData.get('maxRedemptions') as string) : null,
      maxPurchases: formData.get('maxPurchases') ? parseInt(formData.get('maxPurchases') as string) : null,
      terms: formData.get('terms') as string,
      creditPercentage: formData.get('creditPercentage') ? parseInt(formData.get('creditPercentage') as string) * 100 : null, // Convert to basis points
    };

    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      const campaign = await res.json();
      showSuccess(t('success.campaignCreated'));
      router.push(`/merchant/${merchantSlug}/campaigns/${campaign.id}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('success.failedToCreateCampaign'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs
          items={[
            { label: tNav('dashboard'), href: `/merchant/${merchantSlug}/dashboard` },
            { label: tNav('campaigns'), href: `/merchant/${merchantSlug}/campaigns` },
            { label: t('merchant.createCampaign') },
          ]}
        />
        <div className="mb-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
            <span className="text-[#2D2721] font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2721]">{t('merchant.createCampaign')}</h1>
            <p className="text-sm text-[#6B5744]">{t('merchant.setUpCampaign')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <WarmCard className="mb-4" padding="lg">
            <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Basic information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input id="name" name="name" required placeholder="Holiday Special" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Limited time promotion" />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  name="type"
                  required
                  aria-label="Campaign type"
                  className="w-full px-3 py-2 border rounded-md border-[#E7DCC7] bg-white"
                >
                  <option value="limited">Limited</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </WarmCard>

          <WarmCard className="mb-4" padding="lg">
            <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Dates</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  required
                  defaultValue={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  required
                  defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                />
              </div>
            </div>
          </WarmCard>

          <WarmCard className="mb-4" padding="lg">
            <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Pricing and limits</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="price">Price (leave empty for free vouchers)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
                <p className="text-xs text-[#6B5744] mt-1">Price in major units (e.g., 5.00 for $5.00)</p>
              </div>
              <div>
                <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                <Input
                  id="maxRedemptions"
                  name="maxRedemptions"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label htmlFor="maxPurchases">Max Purchases</Label>
                <Input
                  id="maxPurchases"
                  name="maxPurchases"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label htmlFor="creditPercentage">Referrer Credit %</Label>
                <Input
                  id="creditPercentage"
                  name="creditPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="5"
                />
                <p className="text-xs text-[#6B5744] mt-1">Percentage of purchase price as credit (e.g., 5 for 5%)</p>
              </div>
            </div>
          </WarmCard>

          <WarmCard className="mb-4" padding="lg">
            <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Terms and conditions</h2>
            <div>
              <div>
                <Label htmlFor="terms">Terms</Label>
                <textarea
                  id="terms"
                  name="terms"
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md border-[#E7DCC7] bg-white"
                  placeholder="Terms and conditions for this campaign..."
                />
              </div>
            </div>
          </WarmCard>

          <div className="flex gap-4">
            <WarmButton type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Campaign'}
            </WarmButton>
            <WarmButton
              type="button"
              variant="outline"
              onClick={() => router.push(`/merchant/${merchantSlug}/campaigns`)}
            >
              Cancel
            </WarmButton>
          </div>
        </form>
      </div>
    </div>
  );
}
