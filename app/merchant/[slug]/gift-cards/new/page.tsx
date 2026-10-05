'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';
import { formatPrice } from '@/lib/currency-constants';
import { endOfLocalDay, parseMoneyToMinor, startOfLocalDay, toDateInputValue } from '@/lib/money-input';
import { CurrencySelect, exampleAmount } from '../../_components/currency-select';
import { useMerchantSettings } from '../../_components/merchant-settings-context';
import { sanitizeCssValue } from '@/lib/sanitize-css';
import { useLocale, useTranslations } from 'next-intl';

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

const initial: Omit<FormData, 'currency' | 'validFrom' | 'validTo'> = {
  amount: '',
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

// Labels passed to lib/money-input. Its error messages are English sentences
// built from the label; moneyErrorKind maps them back to a translation key.
const AMOUNT_LABEL = 'Amount';
const PRICE_LABEL = 'Sale price';

type MoneyErrorKind = 'negative' | 'invalid' | 'wholeNumber' | 'decimals' | 'tooLarge';

function moneyErrorKind(error: string, label: string): { kind: MoneyErrorKind; decimals: number } | null {
  if (error === `${label} can't be negative.`) return { kind: 'negative', decimals: 0 };
  if (error === `${label} isn't a valid number.`) return { kind: 'invalid', decimals: 0 };
  if (error === `${label} must be a whole number.`) return { kind: 'wholeNumber', decimals: 0 };
  if (error === `${label} is too large.`) return { kind: 'tooLarge', decimals: 0 };
  const match = /at most (\d+) decimal places\.$/.exec(error);
  if (error.startsWith(`${label} can have at most `) && match) return { kind: 'decimals', decimals: Number(match[1]) };
  return null;
}

function priceLocaleFor(locale: string): string {
  return !locale || locale === 'en' ? 'en-GB' : locale;
}

function GiftCardPreview({ form }: { form: FormData }) {
  const t = useTranslations('merchantGiftCards.new');
  const locale = useLocale();
  const parsed = parseMoneyToMinor(form.amount, form.currency, AMOUNT_LABEL);
  const amountStr = parsed.ok && parsed.value !== null ? formatPrice(parsed.value, form.currency, priceLocaleFor(locale)) : '—';
  const headline = form.headline || t('preview.defaultHeadline');
  return (
    <div className="rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden bg-[var(--bg)]">
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
              alt={t('preview.imageAlt')}
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
                alt={t('preview.logoAlt')}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                unoptimized
              />
            ) : null}
          </div>
          <p className="text-2xl font-semibold text-[var(--accent)]">{amountStr}</p>
          {form.message ? (
            <p className="text-sm text-[var(--text-muted)]">{form.message}</p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">{t('preview.notePlaceholder')}</p>
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
  const { defaultCurrency } = useMerchantSettings();
  const [formData, setFormData] = useState<FormData>(() => ({
    ...initial,
    currency: defaultCurrency,
    validFrom: toDateInputValue(new Date()),
    validTo: toDateInputValue(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
  }));
  const amountPreview = parseMoneyToMinor(formData.amount, formData.currency, AMOUNT_LABEL);
  const pricePreview = parseMoneyToMinor(formData.price, formData.currency, PRICE_LABEL);
  const tNav = useTranslations('nav');
  const t = useTranslations('merchantGiftCards.new');
  const locale = useLocale();
  const priceLocale = priceLocaleFor(locale);
  const moneyError = (error: string, label: string, group: 'amountErrors' | 'priceErrors') => {
    const parsed = moneyErrorKind(error, label);
    return parsed ? t(`${group}.${parsed.kind}`, { decimals: parsed.decimals }) : error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const amount = parseMoneyToMinor(formData.amount, formData.currency, AMOUNT_LABEL);
      if (!amount.ok) throw new Error(moneyError(amount.error, AMOUNT_LABEL, 'amountErrors'));
      if (amount.value === null || amount.value <= 0) throw new Error(t('errors.amountRequired'));
      const price = parseMoneyToMinor(formData.price, formData.currency, PRICE_LABEL);
      if (!price.ok) throw new Error(moneyError(price.error, PRICE_LABEL, 'priceErrors'));

      const validFrom = startOfLocalDay(formData.validFrom);
      const validTo = formData.noExpiry ? null : endOfLocalDay(formData.validTo);
      if (validTo && validTo.getTime() < validFrom.getTime()) {
        throw new Error(t('errors.endBeforeStart'));
      }

      const body = {
        amount: amount.value,
        currency: formData.currency,
        validFrom: validFrom.toISOString(),
        validTo: validTo ? validTo.toISOString() : null,
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
        price: formData.purchasable ? price.value : null,
      };

      const res = await fetch(`/api/merchant/${merchantSlug}/gift-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(apiErrorMessage(d, t('errors.createFailed')));
      }

      const giftCard = await res.json();
      showSuccess(t('created'));
      router.push(`/merchant/${merchantSlug}/gift-cards/${giftCard.id}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errors.createFailed'));
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
            { label: t('title') },
          ]}
        />

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{t('title')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('subtitle')}</p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr,360px] lg:gap-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <WarmCard padding="lg" className="bg-[var(--surface)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">{t('valueSection.title')}</h2>
                <p className="text-sm text-[var(--text-muted)]">{t('valueSection.description')}</p>
              </div>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="gift-amount">{t('valueSection.amount')}</Label>
                  <Input
                    id="gift-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="50.00"
                    required
                    aria-describedby="gift-amount-help"
                    className="mt-1 border-[var(--border)]"
                  />
                  <p
                    id="gift-amount-help"
                    className={`text-xs mt-1 ${amountPreview.ok ? 'text-[var(--text-muted)]' : 'text-[var(--danger)]'}`}
                  >
                    {!amountPreview.ok
                      ? moneyError(amountPreview.error, AMOUNT_LABEL, 'amountErrors')
                      : amountPreview.value !== null
                        ? t('valueSection.faceValue', { value: formatPrice(amountPreview.value, formData.currency, priceLocale) })
                        : t('valueSection.amountHelp', { currency: formData.currency, example: exampleAmount(formData.currency, 49.9) })}
                  </p>
                </div>
                <div>
                  <Label htmlFor="gift-currency">{t('valueSection.currency')}</Label>
                  <CurrencySelect
                    id="gift-currency"
                    value={formData.currency}
                    onChange={(currency) => setFormData({ ...formData, currency })}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gift-valid-from">{t('valueSection.validFrom')}</Label>
                    <Input
                      id="gift-valid-from"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      required
                      className="mt-1 border-[var(--border)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-valid-to">{t('valueSection.validTo')}</Label>
                    <Input
                      id="gift-valid-to"
                      type="date"
                      min={formData.validFrom || undefined}
                      value={formData.validTo}
                      onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                      disabled={formData.noExpiry}
                      className="mt-1 border-[var(--border)]"
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
                  <Label htmlFor="no-expiry">{t('valueSection.noExpiry')}</Label>
                </div>
              </div>
            </WarmCard>

            <WarmCard padding="lg" className="bg-[var(--surface)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">{t('purchaseSection.title')}</h2>
                <p className="text-sm text-[var(--text-muted)]">{t('purchaseSection.description')}</p>
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
                  <Label htmlFor="purchasable">{t('purchaseSection.purchasable')}</Label>
                </div>
                {formData.purchasable && (
                  <div>
                    <Label htmlFor="gift-price">{t('purchaseSection.salePrice')}</Label>
                    <Input
                      id="gift-price"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder={formData.amount || t('purchaseSection.salePricePlaceholder')}
                      className="mt-1 border-[var(--border)]"
                    />
                    <p className={`text-xs mt-1 ${pricePreview.ok ? 'text-[var(--text-faint)]' : 'text-[var(--danger)]'}`}>
                      {!pricePreview.ok
                        ? moneyError(pricePreview.error, PRICE_LABEL, 'priceErrors')
                        : pricePreview.value !== null
                          ? t('purchaseSection.customersPay', { value: formatPrice(pricePreview.value, formData.currency, priceLocale) })
                          : t('purchaseSection.salePriceHelp')}
                    </p>
                  </div>
                )}
              </div>
            </WarmCard>

            <WarmCard padding="lg" className="bg-[var(--surface)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">{t('brandingSection.title')}</h2>
                <p className="text-sm text-[var(--text-muted)]">{t('brandingSection.description')}</p>
              </div>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="gift-headline">{t('brandingSection.headline')}</Label>
                  <Input
                    id="gift-headline"
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder={t('brandingSection.headlinePlaceholder')}
                    className="mt-1 border-[var(--border)]"
                  />
                </div>
                <div>
                  <Label htmlFor="gift-message">{t('brandingSection.message')}</Label>
                  <textarea
                    id="gift-message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t('brandingSection.messagePlaceholder')}
                    rows={3}
                    className="w-full mt-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gift-logo-url">{t('brandingSection.logoUrl')}</Label>
                    <Input
                      id="gift-logo-url"
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 border-[var(--border)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-image-url">{t('brandingSection.imageUrl')}</Label>
                    <Input
                      id="gift-image-url"
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 border-[var(--border)]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="gift-accent-color">{t('brandingSection.accentColor')}</Label>
                    <Input
                      id="gift-accent-color"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="mt-1 h-10 w-full p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-background-color">{t('brandingSection.backgroundColor')}</Label>
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
                    <Label htmlFor="gift-text-color">{t('brandingSection.textColor')}</Label>
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
                  <Label htmlFor="gift-code-prefix">{t('brandingSection.codePrefix')}</Label>
                  <Input
                    id="gift-code-prefix"
                    type="text"
                    value={formData.codePrefix}
                    onChange={(e) =>
                      setFormData({ ...formData, codePrefix: e.target.value.toUpperCase() })
                    }
                    placeholder="GIFT"
                    maxLength={12}
                    className="mt-1 border-[var(--border)]"
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
                {t('cancel')}
              </WarmButton>
              <WarmButton type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? t('creating') : t('submit')}
              </WarmButton>
            </div>
          </form>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <p className="text-sm font-medium text-[var(--text-faint)] mb-3">{t('preview.title')}</p>
              <GiftCardPreview form={formData} />
            </div>
          </aside>
        </div>

        <div className="mt-8 lg:hidden">
          <p className="text-sm font-medium text-[var(--text-faint)] mb-3">{t('preview.title')}</p>
          <GiftCardPreview form={formData} />
        </div>
      </div>
    </div>
  );
}
