'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { showError } from '@/lib/toast-helpers';
import { formatCurrency } from '@/lib/utils';
import { sanitizeCssValue } from '@/lib/sanitize-css';
import { useTranslations } from 'next-intl';

type FormData = {
  amount: string;
  currency: string;
  validFrom: string;
  validTo: string;
  noExpiry: boolean;
  headline: string;
  message: string;
  logoUrl: string;
  imageUrl: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  codePrefix: string;
  purchasable: boolean;
  price: string;
};

const initial: FormData = {
  amount: '',
  currency: 'USD',
  validFrom: new Date().toISOString().split('T')[0],
  validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  noExpiry: false,
  headline: '',
  message: '',
  logoUrl: '',
  imageUrl: '',
  accentColor: '#f4b400',
  backgroundColor: '#fff8e6',
  textColor: '#1f2937',
  codePrefix: '',
  purchasable: false,
  price: '',
};

function GiftCardPreview({ form }: { form: FormData }) {
  const amountNum = parseInt(form.amount, 10) || 0;
  const amountStr = formatCurrency(amountNum * 100, form.currency);
  const headline = form.headline || 'Gift card';
  return (
    <div className="rounded-2xl border border-[rgba(139,115,85,0.15)] shadow-lg overflow-hidden bg-[var(--bg)]">
      <style
        dangerouslySetInnerHTML={{
          __html: `.gift-card-preview{--bg:${sanitizeCssValue(form.backgroundColor)};--accent:${sanitizeCssValue(form.accentColor)};--text:${sanitizeCssValue(form.textColor)};}`,
        }}
      />
      <div className="gift-card-preview">
        {form.imageUrl ? (
          <div className="relative h-36 w-full overflow-hidden bg-[#FAF7F2]">
            <Image
              src={form.imageUrl}
              alt="Gift card"
              fill
              sizes="(max-width: 1024px) 100vw, 360px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}
        <div className="p-5 space-y-3 text-[var(--text)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">{headline}</h3>
            {form.logoUrl ? (
              <Image
                src={form.logoUrl}
                alt="Brand logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                unoptimized
              />
            ) : null}
          </div>
          <p className="text-2xl font-semibold text-[var(--accent)]">{amountStr}</p>
          {form.message ? (
            <p className="text-sm text-[#6B5744]">{form.message}</p>
          ) : (
            <p className="text-sm text-[#6B5744]">Add a personal note</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewGiftCardPage() {
  const params = useParams();
  const router = useRouter();
  const merchantSlug = params.slug as string;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initial);
  const tNav = useTranslations('nav');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const amountNum = parseInt(formData.amount, 10);
      if (Number.isNaN(amountNum)) {
        throw new Error('Invalid amount');
      }

      const priceNum = formData.price ? parseInt(formData.price, 10) : null;
      const body = {
        amount: amountNum * 100,
        currency: formData.currency,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: formData.noExpiry ? null : new Date(formData.validTo).toISOString(),
        message: formData.message || null,
        imageUrl: formData.imageUrl || null,
        logoUrl: formData.logoUrl || null,
        designJson: {
          headline: formData.headline,
          accentColor: formData.accentColor,
          backgroundColor: formData.backgroundColor,
          textColor: formData.textColor,
        },
        codePrefix: formData.codePrefix || undefined,
        purchasable: formData.purchasable,
        price: priceNum !== null ? priceNum * 100 : null,
      };

      const res = await fetch(`/api/merchant/${merchantSlug}/gift-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to create gift card');
      }

      const giftCard = await res.json();
      router.push(`/merchant/${merchantSlug}/gift-cards/${giftCard.id}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to create gift card');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { label: tNav('dashboard'), href: `/merchant/${merchantSlug}/dashboard` },
            { label: tNav('giftCards'), href: `/merchant/${merchantSlug}/gift-cards` },
            { label: 'New gift card' },
          ]}
        />

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
            <span className="text-[#2D2721] font-bold text-lg">G</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2721]">New gift card</h1>
            <p className="text-sm text-[#6B5744]">Customize and issue a gift card</p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr,360px] lg:gap-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <WarmCard padding="lg" className="bg-white">
              <div>
                <h2 className="text-base font-semibold text-[#2D2721]">Value and validity</h2>
                <p className="text-sm text-[#6B5744]">Set amount, currency, and expiration</p>
              </div>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="gift-amount">Amount</Label>
                  <Input
                    id="gift-amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="50"
                    required
                    className="mt-1 border-[rgba(139,115,85,0.15)]"
                  />
                </div>
                <div>
                  <Label htmlFor="gift-currency">Currency</Label>
                  <Input
                    id="gift-currency"
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    maxLength={3}
                    required
                    className="mt-1 border-[rgba(139,115,85,0.15)]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gift-valid-from">Valid from</Label>
                    <Input
                      id="gift-valid-from"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      required
                      className="mt-1 border-[rgba(139,115,85,0.15)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-valid-to">Valid to</Label>
                    <Input
                      id="gift-valid-to"
                      type="date"
                      value={formData.validTo}
                      onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                      disabled={formData.noExpiry}
                      className="mt-1 border-[rgba(139,115,85,0.15)]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="no-expiry"
                    checked={formData.noExpiry}
                    onChange={(e) => setFormData({ ...formData, noExpiry: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="no-expiry">No expiry date</Label>
                </div>
              </div>
            </WarmCard>

            <WarmCard padding="lg" className="bg-white">
              <div>
                <h2 className="text-base font-semibold text-[#2D2721]">Customer purchase</h2>
                <p className="text-sm text-[#6B5744]">Allow customers to buy this gift card online</p>
              </div>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="purchasable"
                    checked={formData.purchasable}
                    onChange={(e) => setFormData({ ...formData, purchasable: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="purchasable">Available for customer purchase</Label>
                </div>
                {formData.purchasable && (
                  <div>
                    <Label htmlFor="gift-price">Sale price (optional, defaults to face value)</Label>
                    <Input
                      id="gift-price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder={formData.amount || 'Same as amount'}
                      className="mt-1 border-[rgba(139,115,85,0.15)]"
                    />
                    <p className="text-xs text-[#8B7355] mt-1">
                      Leave empty to sell at face value. Set a different price for promotions.
                    </p>
                  </div>
                )}
              </div>
            </WarmCard>

            <WarmCard padding="lg" className="bg-white">
              <div>
                <h2 className="text-base font-semibold text-[#2D2721]">Branding and message</h2>
                <p className="text-sm text-[#6B5744]">Headline, message, images, and colors</p>
              </div>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="gift-headline">Headline</Label>
                  <Input
                    id="gift-headline"
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="Gift for coffee lovers"
                    className="mt-1 border-[rgba(139,115,85,0.15)]"
                  />
                </div>
                <div>
                  <Label htmlFor="gift-message">Message</Label>
                  <textarea
                    id="gift-message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Add a personal message for the recipient"
                    rows={3}
                    className="w-full mt-1 rounded-md border border-[rgba(139,115,85,0.15)] bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gift-logo-url">Logo URL</Label>
                    <Input
                      id="gift-logo-url"
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 border-[rgba(139,115,85,0.15)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-image-url">Image URL</Label>
                    <Input
                      id="gift-image-url"
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 border-[rgba(139,115,85,0.15)]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="gift-accent-color">Accent color</Label>
                    <Input
                      id="gift-accent-color"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="mt-1 h-10 w-full p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-background-color">Background color</Label>
                    <Input
                      id="gift-background-color"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({ ...formData, backgroundColor: e.target.value })
                      }
                      className="mt-1 h-10 w-full p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-text-color">Text color</Label>
                    <Input
                      id="gift-text-color"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="mt-1 h-10 w-full p-1 cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gift-code-prefix">Code prefix (optional)</Label>
                  <Input
                    id="gift-code-prefix"
                    type="text"
                    value={formData.codePrefix}
                    onChange={(e) =>
                      setFormData({ ...formData, codePrefix: e.target.value.toUpperCase() })
                    }
                    placeholder="GIFT"
                    maxLength={12}
                    className="mt-1 border-[rgba(139,115,85,0.15)]"
                  />
                </div>
              </div>
            </WarmCard>

            <div className="flex gap-2">
              <WarmButton
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/merchant/${merchantSlug}/gift-cards`)}
              >
                Cancel
              </WarmButton>
              <WarmButton type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create gift card'}
              </WarmButton>
            </div>
          </form>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <p className="text-sm font-medium text-[#8B7355] mb-3">Preview</p>
              <GiftCardPreview form={formData} />
            </div>
          </aside>
        </div>

        <div className="mt-8 lg:hidden">
          <p className="text-sm font-medium text-[#8B7355] mb-3">Preview</p>
          <GiftCardPreview form={formData} />
        </div>
      </div>
    </div>
  );
}
