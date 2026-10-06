'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarCheck, Plus, Check, X, Clock } from 'lucide-react';
import { showError } from '@/lib/toast-helpers';
import { parseMoneyToMinor } from '@/lib/money-input';
import { formatPrice } from '@/lib/currency-constants';
import { useMerchantSettings } from '../_components/merchant-settings-context';

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

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'cancelled', 'completed'] as const;
const KNOWN_STATUSES: readonly string[] = STATUS_FILTERS;

interface Appointment {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  priceCents: number;
  currency: string;
  status: string;
  notes?: string;
  user?: { name: string; email: string } | null;
}

export default function AppointmentsPage() {
  const t = useTranslations('merchantCatalog.appointments');
  const tPrice = useTranslations('merchantCatalog.priceErrors');
  const locale = useLocale();
  const displayLocale = !locale || locale === 'en' ? 'en-GB' : locale;
  const params = useParams();
  const slug = params.slug as string;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const { defaultCurrency } = useMerchantSettings();
  const [form, setForm] = useState({
    serviceName: '',
    startTime: '',
    endTime: '',
    price: '', // typed in major units, e.g. 25 or 24,90
    notes: '',
  });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const qs = filter !== 'all' ? `?status=${filter}` : '';
    const res = await fetch(`/api/merchant/${slug}/appointments${qs}`);
    if (res.ok) {
      const data = await res.json();
      setAppointments(data.appointments || []);
    }
    setLoading(false);
  }, [slug, filter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    // Guard against a double-click creating duplicate availability slots.
    if (creating) return;
    const price = parseMoneyToMinor(form.price, defaultCurrency, PRICE_LABEL);
    if (!price.ok) {
      const parsed = moneyErrorKind(price.error, PRICE_LABEL);
      showError(parsed ? tPrice(parsed.kind, { decimals: parsed.decimals }) : price.error);
      return;
    }
    if (new Date(form.endTime).getTime() <= new Date(form.startTime).getTime()) {
      showError(t('errors.endBeforeStart'));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: form.serviceName,
          notes: form.notes,
          priceCents: price.value ?? 0,
          currency: defaultCurrency,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ serviceName: '', startTime: '', endTime: '', price: '', notes: '' });
        fetchAppointments();
      } else {
        showError(t('errors.createFailed'));
      }
    } catch {
      showError(t('errors.network'));
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/merchant/${slug}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) showError(t('errors.updateFailed', { status: res.status }));
    } catch {
      showError(t('errors.network'));
    }
    fetchAppointments();
  }

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    cancelled: '#ef4444',
    completed: '#6366f1',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
            <CalendarCheck style={{ display: 'inline', marginRight: 8 }} size={24} />
            {t('title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{t('subtitle')}</p>
        </div>
        <WarmButton onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {t('createSlot')}
        </WarmButton>
      </div>

      {showForm && (
        <WarmCard style={{ marginBottom: 24, padding: 24 }}>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('form.serviceName')}</Label>
              <Input value={form.serviceName} onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))} required />
            </div>
            <div>
              <Label>{t('form.price', { currency: defaultCurrency })}</Label>
              <Input type="text" inputMode="decimal" placeholder="25.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <Label>{t('form.startTime')}</Label>
              <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
            </div>
            <div>
              <Label>{t('form.endTime')}</Label>
              <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
            </div>
            <div className="sm:col-span-2">
              <Label>{t('form.notes')}</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <WarmButton type="submit" disabled={creating} isLoading={creating}>
                {creating ? t('form.creating') : t('form.submit')}
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, border: '1px solid var(--border)',
            background: filter === s ? 'var(--primary)' : 'var(--surface)', color: filter === s ? '#fff' : 'var(--text)',
            cursor: 'pointer',
          }}>
            {t(`status.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>
      ) : appointments.length === 0 ? (
        <WarmCard style={{ padding: 48, textAlign: 'center' }}>
          <CalendarCheck size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>{t('empty')}</p>
        </WarmCard>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {appointments.map(apt => (
            <WarmCard key={apt.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--text)' }}>{apt.serviceName}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} />
                    {new Date(apt.startTime).toLocaleString(displayLocale, { dateStyle: 'medium', timeStyle: 'short' })} — {new Date(apt.endTime).toLocaleTimeString(displayLocale)}
                  </p>
                  {apt.user && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('bookedBy', { name: apt.user.name || apt.user.email })}</p>}
                  {apt.priceCents > 0 && <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatPrice(apt.priceCents, (apt.currency || 'EUR').toUpperCase(), displayLocale)}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                    background: `${statusColors[apt.status] || '#888'}22`, color: statusColors[apt.status] || '#888',
                  }}>
                    {KNOWN_STATUSES.includes(apt.status)
                      ? t(`status.${apt.status as (typeof STATUS_FILTERS)[number]}`)
                      : apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </span>
                  {apt.status === 'pending' && (
                    <>
                      <button aria-label={t('confirmAria')} title={t('confirm')} onClick={() => updateStatus(apt.id, 'confirmed')} style={{ padding: 4, cursor: 'pointer', color: '#10b981', background: 'none', border: 'none' }}><Check size={18} /></button>
                      <button aria-label={t('cancelAria')} title={t('cancel')} onClick={() => updateStatus(apt.id, 'cancelled')} style={{ padding: 4, cursor: 'pointer', color: '#ef4444', background: 'none', border: 'none' }}><X size={18} /></button>
                    </>
                  )}
                </div>
              </div>
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  );
}
