'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitizeCssValue } from '@/lib/sanitize-css';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';
import {
  endOfLocalDay,
  parseMoneyToMinor,
  parsePercentToBasisPoints,
  startOfLocalDay,
  toDateInputValue,
} from '@/lib/money-input';
import { formatVoucherValue } from '@/lib/voucher-display';
import {
  AMOUNT_LABEL,
  PERCENT_LABEL,
  describeVoucherValueT,
  displayLocaleFor,
  voucherValueErrorMessage,
} from '../voucher-i18n';
import { CurrencySelect, exampleAmount } from '../../_components/currency-select';
import { useMerchantSettings } from '../../_components/merchant-settings-context';
import { parsePaywallResponse, type PaywallDetails } from '@/lib/paywall-utils';
import PaywallModal from '@/components/billing/paywall-modal';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { useLocale, useTranslations } from 'next-intl';

type FormData = {
  type: 'percentage' | 'fixed_amount' | 'credit_amount';
  value: string;
  currency: string;
  validFrom: string;
  validTo: string;
  usageLimitTotal: string;
  usageLimitPerUser: string;
  weeklyDropEnabled: boolean;
  weeklyDropDay: string;
  weeklyDropTime: string;
  weeklyDropStock: string;
  weeklyDropDuration: string;
  designHeadline: string;
  designFinePrint: string;
  designPrimaryColor: string;
  designSecondaryColor: string;
  designBackgroundColor: string;
  codePrefix: string;
};

const initial: Omit<FormData, 'currency' | 'validFrom' | 'validTo'> = {
  type: 'percentage',
  value: '',
  usageLimitTotal: '',
  usageLimitPerUser: '',
  weeklyDropEnabled: false,
  weeklyDropDay: '1',
  weeklyDropTime: '10:00',
  weeklyDropStock: '20',
  weeklyDropDuration: '60',
  designHeadline: '',
  designFinePrint: '',
  designPrimaryColor: '#cc785c',
  designSecondaryColor: '#71717a',
  designBackgroundColor: '#fafafa',
  codePrefix: '',
};

/** Parse the typed value into what we store (basis points or minor units). */
function parseVoucherValue(form: Pick<FormData, 'type' | 'value' | 'currency'>) {
  return form.type === 'percentage'
    ? parsePercentToBasisPoints(form.value, PERCENT_LABEL)
    : parseMoneyToMinor(form.value, form.currency, AMOUNT_LABEL);
}

function VoucherPreview({ form }: { form: FormData }) {
  const t = useTranslations('merchantVouchers.form');
  const tLabels = useTranslations('labels');
  const displayLocale = displayLocaleFor(useLocale());
  const parsed = parseVoucherValue(form);
  const valueStr =
    parsed.ok && parsed.value !== null
      ? formatVoucherValue({ type: form.type, value: parsed.value, currency: form.currency }, displayLocale)
      : '—';
  const headline =
    form.designHeadline ||
    (parsed.ok && parsed.value !== null
      ? describeVoucherValueT(tLabels, { type: form.type, value: parsed.value, currency: form.currency }, displayLocale)
      : t('previewFallbackHeadline'));
  return (
    <div className="voucher-preview w-full max-w-[320px] mx-auto lg:mx-0 rounded-lg border border-[var(--border)] shadow-lg overflow-hidden bg-[var(--preview-bg)]">
      <style dangerouslySetInnerHTML={{ __html: `.voucher-preview{--preview-bg:${sanitizeCssValue(form.designBackgroundColor || '')};--preview-primary:${sanitizeCssValue(form.designPrimaryColor || '')}}` }} />
      <div className="px-5 pt-5 pb-4 text-white bg-[var(--preview-primary)]">
        <h3 className="text-xl font-semibold">{headline}</h3>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{valueStr}</p>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-[var(--text-muted)]">
          {t('previewValidUntil', {
            date: form.validTo ? endOfLocalDay(form.validTo).toLocaleDateString(displayLocale, { dateStyle: 'medium' }) : '—',
          })}
        </p>
        {form.designFinePrint && (
          <p className="text-xs text-[var(--text-muted)] mt-2">{form.designFinePrint}</p>
        )}
      </div>
    </div>
  );
}

export default function NewVoucherPage() {
  const params = useParams();
  const router = useRouter();
  const merchantSlug = params.slug as string;
  const [isLoading, setIsLoading] = useState(false);
  const { defaultCurrency } = useMerchantSettings();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() => ({
    ...initial,
    currency: defaultCurrency,
    validFrom: toDateInputValue(new Date()),
    validTo: toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  }));
  const [weeklyDropsEnabled, setWeeklyDropsEnabled] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallData, setPaywallData] = useState<PaywallDetails | null>(null);
  const t = useTranslations();
  const tNav = useTranslations('nav');
  const tVoucher = useTranslations('voucher');
  const tForm = useTranslations('merchantVouchers.form');
  const tMv = useTranslations('merchantVouchers');
  const displayLocale = displayLocaleFor(useLocale());

  // Fetch feature flags
  useEffect(() => {
    async function fetchFeatureFlags() {
      try {
        const response = await fetch(`/api/merchant/${merchantSlug}/feature-flags`);
        if (response.ok) {
          const flags = await response.json();
          setWeeklyDropsEnabled(flags.weeklyDropsEnabled === true);
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error);
      }
    }
    fetchFeatureFlags();
  }, [merchantSlug]);

  // Step 2 (weekly drop) only exists when the feature is on for this merchant.
  const steps = weeklyDropsEnabled ? [1, 2, 3] : [1, 3];
  const stepPosition = Math.max(1, steps.indexOf(step) + 1);
  const goBack = () => setStep(steps[Math.max(0, steps.indexOf(step) - 1)]);

  const validateStepOne = (): boolean => {
    const parsed = parseVoucherValue(formData);
    if (!parsed.ok) {
      showError(voucherValueErrorMessage(tMv, formData.type, parsed.error));
      return false;
    }
    if (parsed.value === null || parsed.value <= 0) {
      showError(formData.type === 'percentage' ? tForm('errors.discountAboveZero') : tForm('errors.valueAboveZero'));
      return false;
    }
    if (!formData.validFrom || !formData.validTo) {
      showError(tForm('errors.chooseDates'));
      return false;
    }
    if (endOfLocalDay(formData.validTo).getTime() < startOfLocalDay(formData.validFrom).getTime()) {
      showError(tForm('errors.endBeforeStart'));
      return false;
    }
    return true;
  };

  const goNextFromStepOne = () => {
    if (validateStepOne()) setStep(weeklyDropsEnabled ? 2 : 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStepOne()) {
      setStep(1);
      return;
    }
    setIsLoading(true);
    try {
      const weeklyDropJson = formData.weeklyDropEnabled
        ? {
            dayOfWeek: parseInt(formData.weeklyDropDay, 10),
            startTime: formData.weeklyDropTime,
            stock: parseInt(formData.weeklyDropStock, 10),
            durationMinutes: parseInt(formData.weeklyDropDuration, 10),
          }
        : undefined;

      const designJson = {
        headline: formData.designHeadline,
        finePrint: formData.designFinePrint,
        primaryColor: formData.designPrimaryColor,
        secondaryColor: formData.designSecondaryColor,
        backgroundColor: formData.designBackgroundColor,
      };

      const parsedValue = parseVoucherValue(formData);
      if (!parsedValue.ok || parsedValue.value === null) throw new Error(tForm('errors.invalidValue'));

      const body = {
        type: formData.type,
        value: parsedValue.value,
        currency: formData.currency,
        // Date inputs are local calendar days: valid from the start of the
        // first day through the end of the last day.
        validFrom: startOfLocalDay(formData.validFrom).toISOString(),
        validTo: endOfLocalDay(formData.validTo).toISOString(),
        usageLimitTotal: formData.usageLimitTotal ? parseInt(formData.usageLimitTotal, 10) : undefined,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser, 10) : undefined,
        weeklyDropEnabled: formData.weeklyDropEnabled,
        weeklyDropJson,
        designJson,
        codePrefix: formData.codePrefix || undefined,
      };

      const res = await fetch(`/api/merchant/${merchantSlug}/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setPaywallData(parsePaywallResponse(d));
          setPaywallOpen(true);
          return;
        }
        throw new Error(apiErrorMessage(d, t('success.failedToCreateVoucher')));
      }
      const voucher = await res.json();
      showSuccess(tMv('new.created'));
      router.push(`/merchant/${merchantSlug}/vouchers/${voucher.id}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : t('success.failedToCreateVoucher'));
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
            { label: tNav('vouchers'), href: `/merchant/${merchantSlug}/vouchers` },
            { label: tVoucher('create') },
          ]}
        />
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
            <span className="text-white font-bold text-lg">{tMv('new.iconLetter')}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{tVoucher('create')}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {tForm('stepOf', { current: stepPosition, total: steps.length })}
            </p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr,360px] lg:gap-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <WarmCard padding="lg" className="bg-[var(--surface)]">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">{tVoucher('typeAndValue')}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{tVoucher('chooseTypeAndValue')}</p>
                </div>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="voucher-type">{tForm('typeLabel')}</Label>
                    <select
                      id="voucher-type"
                      aria-label={tForm('typeAria')}
                      className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 mt-1"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as FormData['type'] })
                      }
                    >
                      <option value="percentage">{tVoucher('percentageDiscount')}</option>
                      <option value="fixed_amount">{tVoucher('fixedAmountDiscount')}</option>
                      <option value="credit_amount">{tVoucher('creditAmount')}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="voucher-value">
                      {formData.type === 'percentage' ? tVoucher('valuePercent') : tVoucher('valueAmount')}
                    </Label>
                    <Input
                      id="voucher-value"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      required
                      placeholder={formData.type === 'percentage' ? '15' : '4.50'}
                      aria-describedby="voucher-value-help"
                      className="mt-1 border-[var(--border)]"
                    />
                    {(() => {
                      const parsed = parseVoucherValue(formData);
                      return (
                        <p
                          id="voucher-value-help"
                          className={`text-xs mt-1 ${parsed.ok ? 'text-[var(--text-muted)]' : 'text-[var(--danger)]'}`}
                        >
                          {!parsed.ok
                            ? voucherValueErrorMessage(tMv, formData.type, parsed.error)
                            : parsed.value !== null
                              ? tForm(formData.type === 'credit_amount' ? 'customersGetCredit' : 'customersGetOff', {
                                  value: formatVoucherValue(
                                    { type: formData.type, value: parsed.value, currency: formData.currency },
                                    displayLocale,
                                  ),
                                })
                              : formData.type === 'percentage'
                                ? tForm('percentHint')
                                : tForm('amountHint', {
                                    currency: formData.currency,
                                    example: exampleAmount(formData.currency, 4.5),
                                  })}
                        </p>
                      );
                    })()}
                  </div>
                  {formData.type !== 'percentage' && (
                    <div>
                      <Label htmlFor="voucher-currency">{tVoucher('currency')}</Label>
                      <CurrencySelect
                        id="voucher-currency"
                        value={formData.currency}
                        onChange={(currency) => setFormData({ ...formData, currency })}
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="voucher-valid-from">{tVoucher('validFrom')}</Label>
                      <Input
                        id="voucher-valid-from"
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        required
                        className="mt-1 border-[var(--border)]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="voucher-valid-to">{tVoucher('validTo')}</Label>
                      <Input
                        id="voucher-valid-to"
                        type="date"
                        min={formData.validFrom || undefined}
                        value={formData.validTo}
                        onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                        required
                        className="mt-1 border-[var(--border)]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="voucher-limit-total">{tVoucher('totalLimitOptional')}</Label>
                      <Input
                        id="voucher-limit-total"
                        type="number"
                        value={formData.usageLimitTotal}
                        onChange={(e) => setFormData({ ...formData, usageLimitTotal: e.target.value })}
                        className="mt-1 border-[var(--border)]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="voucher-limit-per-user">{tVoucher('perUserLimitOptional')}</Label>
                      <Input
                        id="voucher-limit-per-user"
                        type="number"
                        value={formData.usageLimitPerUser}
                        onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                        className="mt-1 border-[var(--border)]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {tForm('validityHint')}
                  </p>
                  <WarmButton type="button" onClick={goNextFromStepOne} className="w-full">
                    {weeklyDropsEnabled ? tVoucher('nextWeeklyDrop') : tVoucher('nextDesign')}
                  </WarmButton>
                </div>
              </WarmCard>
            )}

            {step === 2 && weeklyDropsEnabled && (
              <WarmCard padding="lg" className="bg-[var(--surface)]">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">{tVoucher('weeklyDropOptional')}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{tVoucher('limitedTimeOffers')}</p>
                </div>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="weeklyDropEnabled"
                      checked={formData.weeklyDropEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, weeklyDropEnabled: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-input"
                      aria-label={tForm('enableWeeklyDropAria')}
                    />
                    <Label htmlFor="weeklyDropEnabled">{tVoucher('enableWeeklyDrop')}</Label>
                  </div>
                  {formData.weeklyDropEnabled && (
                    <>
                      <div>
                        <Label htmlFor="weeklyDropDay">{tVoucher('dayOfWeek')}</Label>
                        <select
                          id="weeklyDropDay"
                          aria-label={tForm('weeklyDropDayAria')}
                          className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 mt-1"
                          value={formData.weeklyDropDay}
                          onChange={(e) => setFormData({ ...formData, weeklyDropDay: e.target.value })}
                        >
                          {[
                            tVoucher('daysOfWeek.sunday'),
                            tVoucher('daysOfWeek.monday'),
                            tVoucher('daysOfWeek.tuesday'),
                            tVoucher('daysOfWeek.wednesday'),
                            tVoucher('daysOfWeek.thursday'),
                            tVoucher('daysOfWeek.friday'),
                            tVoucher('daysOfWeek.saturday'),
                          ].map((d, i) => (
                            <option key={d} value={String(i)}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weeklyDropTime">{tVoucher('startTime')}</Label>
                        <Input
                          id="weeklyDropTime"
                          type="time"
                          value={formData.weeklyDropTime}
                          onChange={(e) => setFormData({ ...formData, weeklyDropTime: e.target.value })}
                          className="mt-1 border-[var(--border)]"
                          aria-label={tForm('weeklyDropTimeAria')}
                          title={tForm('weeklyDropTimeAria')}
                        />
                        </div>
                        <div>
                          <Label htmlFor="weekly-drop-duration">{tVoucher('duration')}</Label>
                          <Input
                            id="weekly-drop-duration"
                            type="number"
                            value={formData.weeklyDropDuration}
                            onChange={(e) =>
                              setFormData({ ...formData, weeklyDropDuration: e.target.value })
                            }
                            className="mt-1 border-[var(--border)]"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="weekly-drop-stock">{tVoucher('stock')}</Label>
                        <Input
                          id="weekly-drop-stock"
                          type="number"
                          value={formData.weeklyDropStock}
                          onChange={(e) => setFormData({ ...formData, weeklyDropStock: e.target.value })}
                          className="mt-1 border-[var(--border)]"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex gap-2">
                    <WarmButton type="button" onClick={() => setStep(1)} variant="outline" className="flex-1">
                      {t('common.back')}
                    </WarmButton>
                    <WarmButton type="button" onClick={() => setStep(3)} className="flex-1">
                      {tVoucher('nextDesign')}
                    </WarmButton>
                  </div>
                </div>
              </WarmCard>
            )}

            {step === 3 && (
              <WarmCard padding="lg" className="bg-[var(--surface)]">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">{tVoucher('design')}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{tVoucher('headlineColorsFinePrint')}</p>
                </div>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="voucher-headline">{tVoucher('headline')}</Label>
                    <Input
                      id="voucher-headline"
                      type="text"
                      value={formData.designHeadline}
                      onChange={(e) => setFormData({ ...formData, designHeadline: e.target.value })}
                      placeholder={tForm('headlinePlaceholder')}
                      className="mt-1 border-[var(--border)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="voucher-fine-print">{tVoucher('finePrint')}</Label>
                    <Input
                      id="voucher-fine-print"
                      type="text"
                      value={formData.designFinePrint}
                      onChange={(e) => setFormData({ ...formData, designFinePrint: e.target.value })}
                      placeholder={tForm('finePrintPlaceholder')}
                      className="mt-1 border-[var(--border)]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="voucher-primary-color">{tVoucher('primaryColor')}</Label>
                      <Input
                        id="voucher-primary-color"
                        type="color"
                        value={formData.designPrimaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, designPrimaryColor: e.target.value })
                        }
                        className="mt-1 h-10 w-full p-1 cursor-pointer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="voucher-secondary-color">{tVoucher('secondaryColor')}</Label>
                      <Input
                        id="voucher-secondary-color"
                        type="color"
                        value={formData.designSecondaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, designSecondaryColor: e.target.value })
                        }
                        className="mt-1 h-10 w-full p-1 cursor-pointer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="voucher-background-color">{tVoucher('backgroundColor')}</Label>
                      <Input
                        id="voucher-background-color"
                        type="color"
                        value={formData.designBackgroundColor}
                        onChange={(e) =>
                          setFormData({ ...formData, designBackgroundColor: e.target.value })
                        }
                        className="mt-1 h-10 w-full p-1 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="voucher-code-prefix">
                      {tVoucher('codePrefix')} ({t('common.optional')})
                    </Label>
                    <Input
                      id="voucher-code-prefix"
                      type="text"
                      value={formData.codePrefix}
                      onChange={(e) =>
                        setFormData({ ...formData, codePrefix: e.target.value.toUpperCase() })
                      }
                      placeholder="CH"
                      maxLength={10}
                      className="mt-1 border-[var(--border)]"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <WarmButton type="button" onClick={goBack} variant="outline" className="flex-1">
                      {t('common.back')}
                    </WarmButton>
                    <WarmButton type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? tVoucher('creating') : tVoucher('create')}
                    </WarmButton>
                  </div>
                </div>
              </WarmCard>
            )}
          </form>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <p className="text-sm font-medium text-[var(--text-muted)] mb-3">{tVoucher('preview')}</p>
              <VoucherPreview form={formData} />
            </div>
          </aside>
        </div>

        {step === 3 && (
          <div className="mt-8 lg:hidden">
            <p className="text-sm font-medium text-[var(--text-muted)] mb-3">{tVoucher('preview')}</p>
            <VoucherPreview form={formData} />
          </div>
        )}

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
      </div>
    </div>
  );
}
