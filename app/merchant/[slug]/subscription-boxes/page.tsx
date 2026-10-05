'use client';

import { useEffect, useState, useCallback } from 'react';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { parseMoneyToMinor } from '@/lib/money-input';
import { SUPPORTED_CURRENCIES } from '@/lib/currency-constants';
import { apiErrorMessage } from '@/lib/api-error-message';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

// Label passed to lib/money-input. Its error messages are English sentences
// built from the label; moneyErrorKind maps them back to a translation key.
const PRICE_LABEL = 'Price';

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

const INTERVALS = ['weekly', 'monthly', 'quarterly'] as const;
function isInterval(value: string): value is (typeof INTERVALS)[number] {
  return (INTERVALS as readonly string[]).includes(value);
}

interface Box {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: string;
  maxItems: number;
  subscriberCount: number;
  itemCount: number;
}

export default function MerchantSubscriptionBoxesPage() {
  const t = useTranslations('merchantCatalog.subscriptionBoxes');
  const tPrice = useTranslations('merchantCatalog.priceErrors');
  const locale = useLocale();
  const displayLocale = !locale || locale === 'en' ? 'en-GB' : locale;
  const { slug } = useParams<{ slug: string }>();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', priceCents: '', currency: 'EUR', interval: 'monthly', maxItems: '3' });
  const [saving, setSaving] = useState(false);

  const fetchBoxes = useCallback(() => {
    fetch(`/api/merchant/${slug}/subscription-boxes`)
      .then((r) => r.json())
      .then((data) => setBoxes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { fetchBoxes(); }, [fetchBoxes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // form.priceCents holds what the merchant typed in major units (e.g. 19,90).
    const price = parseMoneyToMinor(form.priceCents, form.currency, PRICE_LABEL);
    if (!price.ok) {
      const parsed = moneyErrorKind(price.error, PRICE_LABEL);
      showError(parsed ? tPrice(parsed.kind, { decimals: parsed.decimals }) : price.error);
      return;
    }
    if (price.value === null || price.value <= 0) {
      showError(t('errors.priceAboveZero'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/subscription-boxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, priceCents: price.value }),
      });
      if (res.ok) {
        showSuccess(t('created'));
        setShowForm(false);
        setForm({ name: '', description: '', priceCents: '', currency: 'EUR', interval: 'monthly', maxItems: '3' });
        fetchBoxes();
      } else {
        const data = await res.json().catch(() => ({}));
        showError(apiErrorMessage(data, t('errors.createFailed', { status: res.status })));
      }
    } catch {
      showError(t('errors.network'));
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    try {
      return new Intl.NumberFormat(displayLocale, { style: 'currency', currency }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} ${currency}`;
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">{t('title')}</h1>
              <p className="text-[#6b5e52]">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-[#cc785c] to-[#b5613f] text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:opacity-90 transition"
          >
            {showForm ? t('cancel') : t('newBox')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-[var(--surface)] rounded-2xl border border-[#e8e0d8] p-6 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('form.name')}</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#cc785c]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('form.description')}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#cc785c]"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('form.price', { currency: form.currency })}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="19.90"
                  value={form.priceCents}
                  onChange={(e) => setForm({ ...form, priceCents: e.target.value })}
                  className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#cc785c]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('form.currency')}</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#cc785c]"
                >
                  {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('form.interval')}</label>
                <select
                  value={form.interval}
                  onChange={(e) => setForm({ ...form, interval: e.target.value })}
                  className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#cc785c]"
                >
                  <option value="weekly">{t('interval.weekly')}</option>
                  <option value="monthly">{t('interval.monthly')}</option>
                  <option value="quarterly">{t('interval.quarterly')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('form.maxItems')}</label>
                <input
                  type="number"
                  value={form.maxItems}
                  onChange={(e) => setForm({ ...form, maxItems: e.target.value })}
                  className="w-full border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#cc785c]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#cc785c] to-[#b5613f] text-white font-semibold py-2.5 px-6 rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? t('form.creating') : t('form.submit')}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#cc785c] border-t-transparent rounded-full" />
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-12 bg-[var(--surface)] rounded-2xl border border-[#e8e0d8]">
            <p className="text-[#6b5e52]">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {boxes.map((box) => (
              <div key={box.id} className="bg-[var(--surface)] rounded-2xl border border-[#e8e0d8] p-6 hover:shadow-md transition">
                <h3 className="text-lg font-bold text-[var(--text)] mb-1">{box.name}</h3>
                {box.description && <p className="text-sm text-[#6b5e52] mb-3">{box.description}</p>}
                <div className="flex items-center gap-4 text-sm text-[#6b5e52]">
                  <span className="font-semibold text-[#cc785c]">{t('pricePerInterval', {
                    price: formatPrice(box.priceCents, box.currency),
                    interval: isInterval(box.interval) ? t(`intervalUnit.${box.interval}`) : box.interval,
                  })}</span>
                  <span>{t('subscribers', { count: box.subscriberCount })}</span>
                  <span>{t('items', { count: box.itemCount })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
