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
import { apiErrorMessage } from '@/lib/api-error-message';
import { parseMoneyToMinor, toDateInputValue } from '@/lib/money-input';
import { CurrencySelect, exampleAmount } from '../../_components/currency-select';
import { useMerchantSettings } from '../../_components/merchant-settings-context';

export default function NewEventPage() {
  const params = useParams();
  const router = useRouter();
  const merchantSlug = params.slug as string;
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();
  const tNav = useTranslations('nav');
  const tE = useTranslations('merchantEvents');
  const tF = useTranslations('merchantEvents.form');
  const { defaultCurrency } = useMerchantSettings();
  const [currency, setCurrency] = useState(defaultCurrency);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const price = parseMoneyToMinor(String(formData.get('price') ?? ''), currency, tF('ticketPrice'));
    if (!price.ok) {
      showError(price.error);
      return;
    }
    setIsLoading(true);
    const eventDate = formData.get('eventDate') as string;
    const eventTime = formData.get('eventTime') as string;
    const eventEndDate = formData.get('eventEndDate') as string;
    const eventEndTime = formData.get('eventEndTime') as string;

    // Local wall-clock time → ISO (UTC) so the server stores the instant the merchant meant.
    const eventDateTime = eventDate && eventTime ? new Date(`${eventDate}T${eventTime}:00`).toISOString() : null;
    const eventEndDateTime =
      eventEndDate && eventEndTime ? new Date(`${eventEndDate}T${eventEndTime}:00`).toISOString() : null;
    if (eventDateTime && eventEndDateTime && new Date(eventEndDateTime) <= new Date(eventDateTime)) {
      showError(tF('endBeforeStart'));
      setIsLoading(false);
      return;
    }

    const data = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      type: formData.get('type') as 'festival' | 'internal' | 'concert' | 'workshop' | 'other',
      eventDate: eventDateTime || new Date().toISOString(),
      eventEndDate: eventEndDateTime || undefined,
      location: (formData.get('location') as string) || undefined,
      locationAddress: (formData.get('locationAddress') as string) || undefined,
      maxCapacity: parseInt(formData.get('maxCapacity') as string, 10),
      price: price.value ?? 0,
      currency,
      terms: (formData.get('terms') as string) || undefined,
    };

    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(apiErrorMessage(error, t('success.failedToCreateEvent')));
      }

      const event = await res.json();
      showSuccess(t('success.eventCreated'));
      router.push(`/merchant/${merchantSlug}/events/${event.id}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('success.failedToCreateEvent'));
    } finally {
      setIsLoading(false);
    }
  };

  const today = toDateInputValue(new Date());

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs
          items={[
            { label: tNav('dashboard'), href: `/merchant/${merchantSlug}/dashboard` },
            { label: tNav('events'), href: `/merchant/${merchantSlug}/events` },
            { label: t('merchant.createEvent') },
          ]}
        />
        <div className="mb-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{t('merchant.createEvent')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('merchant.setUpEvent')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <WarmCard padding="lg" className="bg-[var(--surface)] mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{tF('basicInfo')}</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{tF('name')}</Label>
                <Input id="name" name="name" required className="border-[var(--border)]" />
              </div>
              <div>
                <Label htmlFor="description">{tF('description')}</Label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full min-h-[100px] px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)]"
                  placeholder={tF('descriptionPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="type">{tF('type')}</Label>
                <select
                  id="type"
                  name="type"
                  required
                  aria-label={tF('typeAria')}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)]"
                >
                  <option value="festival">{tE('type.festival')}</option>
                  <option value="internal">{tE('type.internal')}</option>
                  <option value="concert">{tE('type.concert')}</option>
                  <option value="workshop">{tE('type.workshop')}</option>
                  <option value="other">{tE('type.other')}</option>
                </select>
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-[var(--surface)] mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{tF('dateTime')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate">{tF('eventDate')}</Label>
                  <Input id="eventDate" name="eventDate" type="date" required min={today} className="border-[var(--border)]" />
                </div>
                <div>
                  <Label htmlFor="eventTime">{tF('eventTime')}</Label>
                  <Input id="eventTime" name="eventTime" type="time" required className="border-[var(--border)]" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventEndDate">{tF('endDate')}</Label>
                  <Input id="eventEndDate" name="eventEndDate" type="date" min={today} className="border-[var(--border)]" />
                </div>
                <div>
                  <Label htmlFor="eventEndTime">{tF('endTime')}</Label>
                  <Input id="eventEndTime" name="eventEndTime" type="time" className="border-[var(--border)]" />
                </div>
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-[var(--surface)] mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{tF('location')}</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">{tF('locationName')}</Label>
                <Input id="location" name="location" placeholder={tF('locationPlaceholder')} className="border-[var(--border)]" />
              </div>
              <div>
                <Label htmlFor="locationAddress">{tF('address')}</Label>
                <Input id="locationAddress" name="locationAddress" placeholder={tF('addressPlaceholder')} className="border-[var(--border)]" />
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-[var(--surface)] mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{tF('ticketDetails')}</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maxCapacity">{tF('maxCapacity')}</Label>
                <Input
                  id="maxCapacity"
                  name="maxCapacity"
                  type="number"
                  min="1"
                  required
                  placeholder="100"
                  className="border-[var(--border)]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">{tF('pricePerTicketCurrency', { currency })}</Label>
                  <Input
                    id="price"
                    name="price"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    className="border-[var(--border)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {tF('priceHint', { example: exampleAmount(currency, 12.5) })}
                  </p>
                </div>
                <div>
                  <Label htmlFor="currency">{tF('currency')}</Label>
                  <CurrencySelect id="currency" name="currency" value={currency} onChange={setCurrency} />
                </div>
              </div>
              <div>
                <Label htmlFor="terms">{tF('terms')}</Label>
                <textarea
                  id="terms"
                  name="terms"
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)]"
                  placeholder={tF('termsPlaceholder')}
                />
              </div>
            </div>
          </WarmCard>

          <div className="flex gap-4">
            <WarmButton type="submit" disabled={isLoading}>
              {isLoading ? tE('create.submitting') : tE('create.submit')}
            </WarmButton>
            <WarmButton type="button" variant="outline" onClick={() => router.back()}>
              {tF('cancel')}
            </WarmButton>
          </div>
        </form>
      </div>
    </div>
  );
}
