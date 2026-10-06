'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { safeParseJson } from '@/lib/utils';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { useTranslations } from 'next-intl';

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const merchantSlug = params.slug as string;
  const [isLoading, setIsLoading] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [fetchError, setFetchError] = useState(false);
  const t = useTranslations();
  const tp = useTranslations('merchantSettings.onboarding');
  const tf = useTranslations('merchantSettings.form');

  const loadMerchant = useCallback(() => {
    setFetchError(false);
    setMerchant(null);
    fetch(`/api/merchant/${merchantSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load merchant');
        return res.json();
      })
      .then((data) => setMerchant(data))
      .catch(() => setFetchError(true));
  }, [merchantSlug]);

  useEffect(() => {
    loadMerchant();
  }, [loadMerchant]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      website: (formData.get('website') as string) || null,
      supportEmail: (formData.get('supportEmail') as string) || null,
      brandLogoUrl: (formData.get('brandLogoUrl') as string) || null,
      brandColorsJson: {
        primary: (formData.get('primaryColor') as string) || '#FFC857',
        secondary: (formData.get('secondaryColor') as string) || '#71717a',
        background: (formData.get('backgroundColor') as string) || '#fafafa',
      },
    };

    try {
      const res = await fetch(`/api/merchant/${merchantSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || tp('updateFailed'));
      }

      showSuccess(t('success.merchantProfileUpdated'));
      router.push(`/merchant/${merchantSlug}/dashboard`);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchError) {
    return (
      <div className="p-4 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-[#c84b36]">{tp('loadFailed')}</p>
        <WarmButton size="sm" onClick={loadMerchant}>{tp('retry')}</WarmButton>
      </div>
    );
  }

  if (!merchant) {
    return <div className="p-4 text-sm text-[var(--text-muted)]">{tp('loading')}</div>;
  }

  const brandColors =
    safeParseJson<{ primary: string; secondary: string; background: string }>(merchant.brandColorsJson) ||
    { primary: '#FFC857', secondary: '#71717a', background: '#fafafa' };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--text)]">{tp('title')}</h1>
          <p className="text-sm text-[var(--text-muted)]">{tp('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
            <h2 className="text-base font-semibold text-[var(--text)]">{tp('basicInfo')}</h2>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">{tp('merchantName')}</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={merchant.name}
                  className="mt-1 border-[var(--border)]"
                />
              </div>
              <div>
                <Label htmlFor="website">{tf('website')}</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  defaultValue={merchant.website || ''}
                  className="mt-1 border-[var(--border)]"
                />
              </div>
              <div>
                <Label htmlFor="supportEmail">{tf('supportEmail')}</Label>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  placeholder="support@example.com"
                  defaultValue={merchant.supportEmail || ''}
                  className="mt-1 border-[var(--border)]"
                />
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">{tp('brandTitle')}</h2>
              <p className="text-sm text-[var(--text-muted)]">{tp('brandSubtitle')}</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="brandLogoUrl">{tf('logoUrl')}</Label>
                <Input
                  id="brandLogoUrl"
                  name="brandLogoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  defaultValue={merchant.brandLogoUrl || ''}
                  className="mt-1 border-[var(--border)]"
                />
              </div>
              <div>
                <Label htmlFor="primaryColor">{tf('primaryColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    defaultValue={brandColors.primary}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    defaultValue={brandColors.primary}
                    placeholder="#FFC857"
                    className="flex-1 border-[var(--border)]"
                    aria-label={tf('primaryColorHex')}
                    onChange={(e) => {
                      const colorInput = document.getElementById('primaryColor') as HTMLInputElement;
                      if (colorInput) colorInput.value = e.target.value;
                    }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">{tf('secondaryColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    name="secondaryColor"
                    type="color"
                    defaultValue={brandColors.secondary}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    defaultValue={brandColors.secondary}
                    placeholder="#71717a"
                    className="flex-1 border-[var(--border)]"
                    aria-label={tf('secondaryColorHex')}
                    onChange={(e) => {
                      const colorInput = document.getElementById('secondaryColor') as HTMLInputElement;
                      if (colorInput) colorInput.value = e.target.value;
                    }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="backgroundColor">{tf('backgroundColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    name="backgroundColor"
                    type="color"
                    defaultValue={brandColors.background}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    defaultValue={brandColors.background}
                    placeholder="#fafafa"
                    className="flex-1 border-[var(--border)]"
                    aria-label={tf('backgroundColorHex')}
                    onChange={(e) => {
                      const colorInput = document.getElementById('backgroundColor') as HTMLInputElement;
                      if (colorInput) colorInput.value = e.target.value;
                    }}
                  />
                </div>
              </div>
            </div>
          </WarmCard>

          <div className="flex gap-4">
            <WarmButton type="submit" disabled={isLoading}>
              {isLoading ? tf('saving') : tp('submit')}
            </WarmButton>
            <WarmButton
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={async () => {
                try {
                  await fetch(`/api/merchant/${merchantSlug}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: merchant.name }),
                  });
                } catch {
                  // best-effort — still navigate on failure
                }
                router.push(`/merchant/${merchantSlug}/dashboard`);
              }}
            >
              {tp('skip')}
            </WarmButton>
          </div>
        </form>
      </div>
    </div>
  );
}
