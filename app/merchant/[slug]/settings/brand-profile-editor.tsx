'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { useTranslations } from 'next-intl';

interface BrandProfileEditorProps {
  merchant: {
    slug: string;
    brandLogoUrl: string | null;
    website: string | null;
    supportEmail: string | null;
  };
  brandColors: {
    primary?: string;
    secondary?: string;
    background?: string;
  } | null;
}

export default function BrandProfileEditor({ merchant, brandColors }: BrandProfileEditorProps) {
  const params = useParams();
  const router = useRouter();
  const merchantSlug = params.slug as string;
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('merchantSettings.brandProfile');
  const tf = useTranslations('merchantSettings.form');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
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
        throw new Error(error.error || t('updateFailed'));
      }

      showSuccess(t('updated'));
      router.refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : t('updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
      <div>
        <h2 className="text-base font-semibold text-[var(--text)]">{t('title')}</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {t('subtitle')}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
              defaultValue={brandColors?.primary || '#FFC857'}
              className="w-20 h-10"
            />
            <Input
              type="text"
              defaultValue={brandColors?.primary || '#FFC857'}
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
              defaultValue={brandColors?.secondary || '#71717a'}
              className="w-20 h-10"
            />
            <Input
              type="text"
              defaultValue={brandColors?.secondary || '#71717a'}
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
              defaultValue={brandColors?.background || '#fafafa'}
              className="w-20 h-10"
            />
            <Input
              type="text"
              defaultValue={brandColors?.background || '#fafafa'}
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
        <WarmButton type="submit" disabled={isLoading}>
          {isLoading ? tf('saving') : t('save')}
        </WarmButton>
      </form>
    </WarmCard>
  );
}
