'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, safeParseJson } from '@/lib/utils';
import { sanitizeCssValue } from '@/lib/sanitize-css';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { useTranslations } from 'next-intl';
import { Voucher } from '@prisma/client';
import { VoucherDesign, WeeklyDropConfig } from '@/types';
import PublishVoucherButton from './publish-button';

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

function VoucherPreview({ form }: { form: FormData }) {
  const val = parseInt(form.value, 10) || 0;
  const valueStr =
    form.type === 'percentage' ? `${val}%` : formatCurrency(val * 100, form.currency);
  const headline = form.designHeadline || 'Voucher';
  return (
    <div className="voucher-preview w-full max-w-[320px] mx-auto lg:mx-0 rounded-2xl border border-[rgba(139,115,85,0.15)] shadow-warm overflow-hidden bg-[var(--preview-bg)]">
      <style
        dangerouslySetInnerHTML={{
          __html: `.voucher-preview{--preview-bg:${sanitizeCssValue(form.designBackgroundColor)};--preview-primary:${sanitizeCssValue(form.designPrimaryColor)}}`,
        }}
      />
      <div className="px-5 pt-5 pb-4 text-white bg-[var(--preview-primary)]">
        <h3 className="text-xl font-semibold">{headline}</h3>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{valueStr}</p>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-[#6B5744]">
          Valid until {new Date(form.validTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </p>
        {form.designFinePrint && <p className="text-xs text-[#8B7355] mt-2">{form.designFinePrint}</p>}
      </div>
    </div>
  );
}

export default function EditVoucherForm({ voucher, merchantSlug }: { voucher: Voucher; merchantSlug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [weeklyDropsEnabled, setWeeklyDropsEnabled] = useState(false);
  const t = useTranslations();
  const tVoucher = useTranslations('voucher');

  const design = safeParseJson<VoucherDesign>(voucher.designJson);
  const weeklyDrop = safeParseJson<WeeklyDropConfig>(voucher.weeklyDropJson);

  const valueDisplay =
    voucher.type === 'percentage'
      ? (voucher.value / 100).toString()
      : (voucher.value / 100).toString();

  const [formData, setFormData] = useState<FormData>({
    type: voucher.type as 'percentage' | 'fixed_amount' | 'credit_amount',
    value: valueDisplay,
    currency: voucher.currency,
    validFrom: new Date(voucher.validFrom).toISOString().split('T')[0],
    validTo: new Date(voucher.validTo).toISOString().split('T')[0],
    usageLimitTotal: voucher.usageLimitTotal?.toString() || '',
    usageLimitPerUser: voucher.usageLimitPerUser?.toString() || '',
    weeklyDropEnabled: voucher.weeklyDropEnabled,
    weeklyDropDay: weeklyDrop?.dayOfWeek?.toString() || '1',
    weeklyDropTime: weeklyDrop?.startTime || '10:00',
    weeklyDropStock: weeklyDrop?.stock?.toString() || '20',
    weeklyDropDuration: weeklyDrop?.durationMinutes?.toString() || '60',
    designHeadline: design?.headline || '',
    designFinePrint: design?.finePrint || '',
    designPrimaryColor: design?.primaryColor || '#FFC857',
    designSecondaryColor: design?.secondaryColor || '#71717a',
    designBackgroundColor: design?.backgroundColor || '#fafafa',
    codePrefix: voucher.codePrefix || '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const valueNum = parseInt(formData.value, 10);
      if (Number.isNaN(valueNum) || valueNum <= 0) {
        throw new Error('Value must be greater than 0');
      }

      const validFromDate = new Date(formData.validFrom);
      const validToDate = new Date(formData.validTo);
      if (validFromDate >= validToDate) {
        throw new Error('Valid to date must be after valid from date');
      }

      if (formData.usageLimitTotal) {
        const totalLimit = parseInt(formData.usageLimitTotal, 10);
        if (Number.isNaN(totalLimit) || totalLimit <= 0) {
          throw new Error('Total usage limit must be a positive number');
        }
      }

      if (formData.usageLimitPerUser) {
        const perUserLimit = parseInt(formData.usageLimitPerUser, 10);
        if (Number.isNaN(perUserLimit) || perUserLimit <= 0) {
          throw new Error('Per user limit must be a positive number');
        }
      }

      const weeklyDropJson = formData.weeklyDropEnabled
        ? {
            dayOfWeek: parseInt(formData.weeklyDropDay, 10),
            startTime: formData.weeklyDropTime,
            stock: parseInt(formData.weeklyDropStock, 10),
            durationMinutes: parseInt(formData.weeklyDropDuration, 10),
          }
        : null;

      const designJson = {
        headline: formData.designHeadline,
        finePrint: formData.designFinePrint,
        primaryColor: formData.designPrimaryColor,
        secondaryColor: formData.designSecondaryColor,
        backgroundColor: formData.designBackgroundColor,
      };

      const body = {
        type: formData.type,
        value: formData.type === 'percentage' ? valueNum * 100 : valueNum * 100,
        currency: formData.currency,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
        usageLimitTotal: formData.usageLimitTotal ? parseInt(formData.usageLimitTotal, 10) : null,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser, 10) : null,
        weeklyDropEnabled: formData.weeklyDropEnabled,
        weeklyDropJson,
        designJson,
        codePrefix: formData.codePrefix || null,
      };

      const res = await fetch(`/api/merchant/${merchantSlug}/vouchers/${voucher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const errorMsg = d.error || 'Failed to update voucher';
        if (typeof errorMsg === 'string') {
          throw new Error(errorMsg);
        } else if (Array.isArray(d.error)) {
          const firstError = d.error[0];
          throw new Error(firstError?.message || 'Please check your input and try again');
        }
        throw new Error('Failed to update voucher. Please try again.');
      }
      showSuccess(tVoucher('updated') || 'Voucher updated successfully');
      router.refresh();
    } catch (e) {
      const errorMessage = e instanceof Error
        ? e.message
        : t('success.failedToUpdateVoucher') || 'Failed to update voucher';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lg:grid lg:grid-cols-[1fr,360px] lg:gap-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
            <div>
              <h2 className="text-base font-semibold text-[#2D2721]">{tVoucher('typeAndValue')}</h2>
              <p className="text-sm text-[#6B5744]">{tVoucher('chooseTypeAndValue')}</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="voucher-type">Type</Label>
                <select
                  id="voucher-type"
                  aria-label="Voucher type"
                  className="w-full h-10 rounded-md border border-[rgba(139,115,85,0.15)] bg-white px-3 py-2 mt-1"
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
                <Label htmlFor="edit-voucher-value">
                  {formData.type === 'percentage' ? tVoucher('valuePercent') : tVoucher('valueAmount')}
                </Label>
                <Input
                  id="edit-voucher-value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  placeholder={formData.type === 'percentage' ? '15' : '5'}
                  className="mt-1 border-[rgba(139,115,85,0.15)]"
                />
              </div>
              <div>
                <Label htmlFor="edit-voucher-currency">{tVoucher('currency')}</Label>
                <Input
                  id="edit-voucher-currency"
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                  maxLength={3}
                  className="mt-1 border-[rgba(139,115,85,0.15)]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-voucher-valid-from">{tVoucher('validFrom')}</Label>
                  <Input
                    id="edit-voucher-valid-from"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                    className="mt-1 border-[rgba(139,115,85,0.15)]"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-voucher-valid-to">{tVoucher('validTo')}</Label>
                  <Input
                    id="edit-voucher-valid-to"
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    required
                    className="mt-1 border-[rgba(139,115,85,0.15)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-voucher-limit-total">{tVoucher('totalLimitOptional')}</Label>
                  <Input
                    id="edit-voucher-limit-total"
                    type="number"
                    value={formData.usageLimitTotal}
                    onChange={(e) => setFormData({ ...formData, usageLimitTotal: e.target.value })}
                    className="mt-1 border-[rgba(139,115,85,0.15)]"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-voucher-limit-per-user">{tVoucher('perUserLimitOptional')}</Label>
                  <Input
                    id="edit-voucher-limit-per-user"
                    type="number"
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                    className="mt-1 border-[rgba(139,115,85,0.15)]"
                  />
                </div>
              </div>
              {weeklyDropsEnabled ? (
                <WarmButton type="button" onClick={() => setStep(2)} className="w-full">
                  {tVoucher('nextWeeklyDrop')}
                </WarmButton>
              ) : (
                <WarmButton type="button" onClick={() => setStep(3)} className="w-full">
                  {tVoucher('nextDesign')}
                </WarmButton>
              )}
            </div>
          </WarmCard>
        )}

        {step === 2 && weeklyDropsEnabled && (
          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
            <div>
              <h2 className="text-base font-semibold text-[#2D2721]">{tVoucher('weeklyDropOptional')}</h2>
              <p className="text-sm text-[#6B5744]">{tVoucher('limitedTimeOffers')}</p>
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
                  className="h-4 w-4 accent-[#FFC857]"
                  aria-label="Enable weekly drop"
                />
                <Label htmlFor="weeklyDropEnabled">{tVoucher('enableWeeklyDrop')}</Label>
              </div>
              {formData.weeklyDropEnabled && (
                <>
                  <div>
                    <Label htmlFor="weeklyDropDay">{tVoucher('dayOfWeek')}</Label>
                    <select
                      id="weeklyDropDay"
                      aria-label="Day of week for weekly drop"
                      className="w-full h-10 rounded-md border border-[rgba(139,115,85,0.15)] bg-white px-3 py-2 mt-1"
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
                        className="mt-1 border-[rgba(139,115,85,0.15)]"
                        aria-label="Weekly drop start time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-weekly-drop-duration">{tVoucher('duration')}</Label>
                      <Input
                        id="edit-weekly-drop-duration"
                        type="number"
                        value={formData.weeklyDropDuration}
                        onChange={(e) =>
                          setFormData({ ...formData, weeklyDropDuration: e.target.value })
                        }
                        className="mt-1 border-[rgba(139,115,85,0.15)]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-weekly-drop-stock">{tVoucher('stock')}</Label>
                    <Input
                      id="edit-weekly-drop-stock"
                      type="number"
                      value={formData.weeklyDropStock}
                      onChange={(e) => setFormData({ ...formData, weeklyDropStock: e.target.value })}
                      className="mt-1 border-[rgba(139,115,85,0.15)]"
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
          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
            <div>
              <h2 className="text-base font-semibold text-[#2D2721]">{tVoucher('design')}</h2>
              <p className="text-sm text-[#6B5744]">{tVoucher('headlineColorsFinePrint')}</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-voucher-headline">{tVoucher('headline')}</Label>
                <Input
                  id="edit-voucher-headline"
                  type="text"
                  value={formData.designHeadline}
                  onChange={(e) => setFormData({ ...formData, designHeadline: e.target.value })}
                  placeholder="15% off your order"
                  className="mt-1 border-[rgba(139,115,85,0.15)]"
                />
              </div>
              <div>
                <Label htmlFor="edit-voucher-fine-print">{tVoucher('finePrint')}</Label>
                <Input
                  id="edit-voucher-fine-print"
                  type="text"
                  value={formData.designFinePrint}
                  onChange={(e) => setFormData({ ...formData, designFinePrint: e.target.value })}
                  placeholder="Valid for new customers only"
                  className="mt-1 border-[rgba(139,115,85,0.15)]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-voucher-primary-color">{tVoucher('primaryColor')}</Label>
                  <Input
                    id="edit-voucher-primary-color"
                    type="color"
                    value={formData.designPrimaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, designPrimaryColor: e.target.value })
                    }
                    className="mt-1 h-10 w-full p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-voucher-secondary-color">{tVoucher('secondaryColor')}</Label>
                  <Input
                    id="edit-voucher-secondary-color"
                    type="color"
                    value={formData.designSecondaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, designSecondaryColor: e.target.value })
                    }
                    className="mt-1 h-10 w-full p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-voucher-background-color">{tVoucher('backgroundColor')}</Label>
                  <Input
                    id="edit-voucher-background-color"
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
                <Label htmlFor="edit-voucher-code-prefix">{tVoucher('codePrefix')} ({t('common.optional')})</Label>
                <Input
                  id="edit-voucher-code-prefix"
                  type="text"
                  value={formData.codePrefix}
                  onChange={(e) =>
                    setFormData({ ...formData, codePrefix: e.target.value.toUpperCase() })
                  }
                  placeholder="CH"
                  maxLength={10}
                  className="mt-1 border-[rgba(139,115,85,0.15)]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <WarmButton type="button" onClick={() => setStep(weeklyDropsEnabled ? 2 : 1)} variant="outline" className="flex-1">
                  {t('common.back')}
                </WarmButton>
                <WarmButton type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? tVoucher('updating') || 'Updating...' : tVoucher('update') || 'Update voucher'}
                </WarmButton>
              </div>
            </div>
          </WarmCard>
        )}
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <p className="text-sm font-medium text-[#6B5744] mb-3">{tVoucher('preview')}</p>
          <VoucherPreview form={formData} />
          <div className="mt-4 space-y-2">
            <WarmButton asChild variant="outline" className="w-full">
              <Link href={`/v/${voucher.id}`}>View public page</Link>
            </WarmButton>
            {voucher.status !== 'published' && <PublishVoucherButton voucherId={voucher.id} />}
          </div>
        </div>
      </aside>

      {step === 3 && (
        <div className="mt-8 lg:hidden">
          <p className="text-sm font-medium text-[#6B5744] mb-3">{tVoucher('preview')}</p>
          <VoucherPreview form={formData} />
        </div>
      )}
    </div>
  );
}
