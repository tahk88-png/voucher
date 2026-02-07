'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { showError } from '@/lib/toast-helpers';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { useTranslations } from 'next-intl';

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

const initial: FormData = {
  type: 'percentage',
  value: '',
  currency: 'USD',
  validFrom: new Date().toISOString().split('T')[0],
  validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  usageLimitTotal: '',
  usageLimitPerUser: '',
  weeklyDropEnabled: false,
  weeklyDropDay: '1',
  weeklyDropTime: '10:00',
  weeklyDropStock: '20',
  weeklyDropDuration: '60',
  designHeadline: '',
  designFinePrint: '',
  designPrimaryColor: '#FFC857',
  designSecondaryColor: '#71717a',
  designBackgroundColor: '#fafafa',
  codePrefix: '',
};

function VoucherPreview({ form }: { form: FormData }) {
  const val = parseInt(form.value, 10) || 0;
  const valueStr =
    form.type === 'percentage'
      ? `${val}%`
      : formatCurrency(val * 100, form.currency);
  const headline = form.designHeadline || 'Voucher';
  return (
    <div className="voucher-preview w-full max-w-[320px] mx-auto lg:mx-0 rounded-lg border border-[#E7DCC7] shadow-lg overflow-hidden bg-[var(--preview-bg)]">
      <style dangerouslySetInnerHTML={{ __html: `.voucher-preview{--preview-bg:${form.designBackgroundColor};--preview-primary:${form.designPrimaryColor}}` }} />
      <div className="px-5 pt-5 pb-4 text-white bg-[var(--preview-primary)]">
        <h3 className="text-xl font-semibold">{headline}</h3>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{valueStr}</p>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-[#6B5744]">
          Valid until {new Date(form.validTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </p>
        {form.designFinePrint && (
          <p className="text-xs text-[#6B5744] mt-2">{form.designFinePrint}</p>
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
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initial);
  const [weeklyDropsEnabled, setWeeklyDropsEnabled] = useState(false);
  const t = useTranslations();
  const tNav = useTranslations('nav');
  const tVoucher = useTranslations('voucher');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const valueNum = parseInt(formData.value, 10);
      if (Number.isNaN(valueNum)) throw new Error('Invalid value');

      const body = {
        type: formData.type,
        value: formData.type === 'percentage' ? valueNum * 100 : valueNum * 100,
        currency: formData.currency,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
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
        throw new Error(d.error || 'Failed to create voucher');
      }
      const voucher = await res.json();
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
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
            <span className="text-[#2D2721] font-bold text-lg">V</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2721]">{tVoucher('create')}</h1>
            <p className="text-sm text-[#6B5744]">
              {tVoucher('step')} {step} {tVoucher('of')} 3
            </p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr,360px] lg:gap-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <WarmCard padding="lg" className="bg-white">
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
                      className="w-full h-10 rounded-md border border-[#E7DCC7] bg-white px-3 py-2 mt-1"
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
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      required
                      placeholder={formData.type === 'percentage' ? '15' : '5'}
                      className="mt-1 border-[#E7DCC7]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="voucher-currency">{tVoucher('currency')}</Label>
                    <Input
                      id="voucher-currency"
                      type="text"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      required
                      maxLength={3}
                      className="mt-1 border-[#E7DCC7]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="voucher-valid-from">{tVoucher('validFrom')}</Label>
                      <Input
                        id="voucher-valid-from"
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        required
                        className="mt-1 border-[#E7DCC7]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="voucher-valid-to">{tVoucher('validTo')}</Label>
                      <Input
                        id="voucher-valid-to"
                        type="date"
                        value={formData.validTo}
                        onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                        required
                        className="mt-1 border-[#E7DCC7]"
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
                        className="mt-1 border-[#E7DCC7]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="voucher-limit-per-user">{tVoucher('perUserLimitOptional')}</Label>
                      <Input
                        id="voucher-limit-per-user"
                        type="number"
                        value={formData.usageLimitPerUser}
                        onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                        className="mt-1 border-[#E7DCC7]"
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
              <WarmCard padding="lg" className="bg-white">
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
                      className="h-4 w-4 rounded border-input"
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
                          className="w-full h-10 rounded-md border border-[#E7DCC7] bg-white px-3 py-2 mt-1"
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
                          className="mt-1 border-[#E7DCC7]"
                          aria-label="Weekly drop start time"
                          title="Weekly drop start time"
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
                            className="mt-1 border-[#E7DCC7]"
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
                          className="mt-1 border-[#E7DCC7]"
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
              <WarmCard padding="lg" className="bg-white">
                <div>
                  <h2 className="text-base font-semibold text-[#2D2721]">{tVoucher('design')}</h2>
                  <p className="text-sm text-[#6B5744]">{tVoucher('headlineColorsFinePrint')}</p>
                </div>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="voucher-headline">{tVoucher('headline')}</Label>
                    <Input
                      id="voucher-headline"
                      type="text"
                      value={formData.designHeadline}
                      onChange={(e) => setFormData({ ...formData, designHeadline: e.target.value })}
                      placeholder="15% off your order"
                      className="mt-1 border-[#E7DCC7]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="voucher-fine-print">{tVoucher('finePrint')}</Label>
                    <Input
                      id="voucher-fine-print"
                      type="text"
                      value={formData.designFinePrint}
                      onChange={(e) => setFormData({ ...formData, designFinePrint: e.target.value })}
                      placeholder="Valid for new customers only"
                      className="mt-1 border-[#E7DCC7]"
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
                      className="mt-1 border-[#E7DCC7]"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <WarmButton type="button" onClick={() => setStep(2)} variant="outline" className="flex-1">
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
              <p className="text-sm font-medium text-[#6B5744] mb-3">{tVoucher('preview')}</p>
              <VoucherPreview form={formData} />
            </div>
          </aside>
        </div>

        {step === 3 && (
          <div className="mt-8 lg:hidden">
            <p className="text-sm font-medium text-[#6B5744] mb-3">{tVoucher('preview')}</p>
            <VoucherPreview form={formData} />
          </div>
        )}
      </div>
    </div>
  );
}
