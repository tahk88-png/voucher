'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { apiErrorMessage } from '@/lib/api-error-message';
import { minorToInputString, parseMoneyToMinor, toDateInputValue } from '@/lib/money-input';
import { CurrencySelect } from '../../../_components/currency-select';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const merchantSlug = params.slug as string;
  const eventId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const t = useTranslations();

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          // Keep ISO instants; the inputs below derive local date/time from them.
          setEvent(data);
        }
      })
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const currency = String(formData.get('currency') || event?.currency || 'EUR');
    const price = parseMoneyToMinor(String(formData.get('price') ?? ''), currency, 'Ticket price');
    if (!price.ok) {
      showError(price.error);
      return;
    }
    setIsLoading(true);
    const eventDate = formData.get('eventDate') as string;
    const eventTime = formData.get('eventTime') as string;
    const eventEndDate = formData.get('eventEndDate') as string;
    const eventEndTime = formData.get('eventEndTime') as string;

    // Local wall-clock time → ISO instant (the API requires a full ISO datetime).
    const eventDateTime = eventDate && eventTime ? new Date(`${eventDate}T${eventTime}:00`).toISOString() : null;
    const eventEndDateTime =
      eventEndDate && eventEndTime ? new Date(`${eventEndDate}T${eventEndTime}:00`).toISOString() : null;
    if (eventDateTime && eventEndDateTime && new Date(eventEndDateTime) <= new Date(eventDateTime)) {
      showError('The end time must be after the start time.');
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
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(apiErrorMessage(error, 'Failed to update event'));
      }

      showSuccess(t('success.eventUpdated'));
      router.push(`/merchant/${merchantSlug}/events/${eventId}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('success.failedToUpdateEvent'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-[var(--text-muted)]">Event not found.</p>
        </div>
      </div>
    );
  }

  const eventDateObj = event.eventDate ? new Date(event.eventDate) : new Date();
  const eventEndDateObj = event.eventEndDate ? new Date(event.eventEndDate) : null;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <WarmButton asChild variant="ghost" className="mb-4">
            <Link href={`/merchant/${merchantSlug}/events/${eventId}`}>Back to event</Link>
          </WarmButton>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Edit event</h1>
          <p className="text-sm text-[var(--text-muted)]">Update your event details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <WarmCard padding="lg" className="bg-[var(--surface)]">
            <h2 className="text-base font-semibold text-[var(--text)]">Basic information</h2>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Event name *</Label>
                <Input id="name" name="name" required defaultValue={event.name} className="mt-1 border-[var(--border)]" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full min-h-[100px] px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)]"
                  placeholder="Describe your event..."
                  defaultValue={event.description || ''}
                />
              </div>
              <div>
                <Label htmlFor="type">Event type *</Label>
                <select
                  id="type"
                  name="type"
                  required
                  defaultValue={event.type}
                  aria-label="Event type"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)]"
                >
                  <option value="festival">Festival</option>
                  <option value="internal">Internal event</option>
                  <option value="concert">Concert</option>
                  <option value="workshop">Workshop</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-[var(--surface)]">
            <h2 className="text-base font-semibold text-[var(--text)]">Date and time</h2>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate">Event date *</Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    required
                    defaultValue={toDateInputValue(eventDateObj)}
                    className="mt-1 border-[var(--border)]"
                  />
                </div>
                <div>
                  <Label htmlFor="eventTime">Event time *</Label>
                  <Input
                    id="eventTime"
                    name="eventTime"
                    type="time"
                    required
                    defaultValue={eventDateObj.toTimeString().slice(0, 5)}
                    className="mt-1 border-[var(--border)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventEndDate">End date (optional)</Label>
                  <Input
                    id="eventEndDate"
                    name="eventEndDate"
                    type="date"
                    defaultValue={eventEndDateObj ? toDateInputValue(eventEndDateObj) : ''}
                    className="mt-1 border-[var(--border)]"
                  />
                </div>
                <div>
                  <Label htmlFor="eventEndTime">End time (optional)</Label>
                  <Input
                    id="eventEndTime"
                    name="eventEndTime"
                    type="time"
                    defaultValue={eventEndDateObj ? eventEndDateObj.toTimeString().slice(0, 5) : ''}
                    className="mt-1 border-[var(--border)]"
                  />
                </div>
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-[var(--surface)]">
            <h2 className="text-base font-semibold text-[var(--text)]">Location</h2>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="location">Location name</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Main Hall, Outdoor Stage"
                  defaultValue={event.location || ''}
                  className="mt-1 border-[var(--border)]"
                />
              </div>
              <div>
                <Label htmlFor="locationAddress">Full address</Label>
                <Input
                  id="locationAddress"
                  name="locationAddress"
                  placeholder="Street address, City, Country"
                  defaultValue={event.locationAddress || ''}
                  className="mt-1 border-[var(--border)]"
                />
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-[var(--surface)]">
            <h2 className="text-base font-semibold text-[var(--text)]">Ticket details</h2>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="maxCapacity">Max capacity (number of tickets) *</Label>
                <Input
                  id="maxCapacity"
                  name="maxCapacity"
                  type="number"
                  min="1"
                  required
                  placeholder="100"
                  defaultValue={event.maxCapacity}
                  className="mt-1 border-[var(--border)]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price per ticket</Label>
                  <Input
                    id="price"
                    name="price"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00 (free)"
                    defaultValue={minorToInputString(event.price, event.currency)}
                    className="mt-1 border-[var(--border)]"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <CurrencySelect id="currency" name="currency" defaultValue={event.currency} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="terms">Terms and conditions</Label>
                <textarea
                  id="terms"
                  name="terms"
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)]"
                  placeholder="Event terms, refund policy, etc."
                  defaultValue={event.terms || ''}
                />
              </div>
            </div>
          </WarmCard>

          <div className="flex gap-4">
            <WarmButton type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save changes'}
            </WarmButton>
            <WarmButton type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </WarmButton>
          </div>
        </form>
      </div>
    </div>
  );
}
