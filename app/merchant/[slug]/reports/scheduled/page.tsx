'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Mail,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface Schedule {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  lastSentAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

const PERIODS = ['daily', 'weekly', 'monthly'] as const;

export default function ScheduledReportsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('merchantDashboard.scheduled');
  // Dates follow the UI language (English unless Estonian is active).
  const dateLocale = useLocale() === 'et' ? 'et' : 'en-GB';

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New schedule form
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/reports`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  function addRecipient() {
    const email = recipientInput.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('invalidEmail'));
      return;
    }
    if (recipients.includes(email)) {
      setError(t('emailAlreadyAdded'));
      return;
    }
    setRecipients([...recipients, email]);
    setRecipientInput('');
    setError('');
  }

  function removeRecipient(email: string) {
    setRecipients(recipients.filter((r) => r !== email));
  }

  async function handleSave() {
    if (recipients.length === 0) {
      setError(t('addAtLeastOne'));
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/merchant/${slug}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, recipients, enabled: true }),
      });

      if (res.ok) {
        setSuccess(t('saved'));
        setRecipients([]);
        fetchSchedules();
      } else {
        const data = await res.json();
        setError(data.error ?? t('saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleSchedule(schedule: Schedule) {
    try {
      await fetch(`/api/merchant/${slug}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: schedule.period,
          recipients: schedule.recipients,
          enabled: !schedule.enabled,
        }),
      });
      fetchSchedules();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{t('title')}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t('subtitle')}</p>
        </div>
        <Link href={`/merchant/${slug}/reports`}>
          <WarmButton variant="outline" size="sm">
            {t('backToReports')}
          </WarmButton>
        </Link>
      </div>

      {/* Existing Schedules */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-base font-semibold text-[var(--text)] mb-4">{t('activeSchedules')}</h2>
        {loading ? (
          <div className="text-sm text-[var(--text-muted)]">{t('loading')}</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('noSchedules')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  s.enabled ? 'border-[var(--border)] bg-[var(--surface)]' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      s.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text)]">
                      {PERIODS.includes(s.period) ? t(`reportTitle.${s.period}`) : s.period}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {t('recipientCount', { count: s.recipients.length })}
                      {s.lastSentAt && (
                        <> &bull; {t('lastSent', { date: new Date(s.lastSentAt).toLocaleDateString(dateLocale) })}</>
                      )}
                      {s.nextRunAt && (
                        <> &bull; {t('nextRun', { date: new Date(s.nextRunAt).toLocaleDateString(dateLocale) })}</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <WarmButton
                    size="sm"
                    variant={s.enabled ? 'secondary' : 'primary'}
                    onClick={() => toggleSchedule(s)}
                  >
                    {s.enabled ? t('pause') : t('resume')}
                  </WarmButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </WarmCard>

      {/* New Schedule Form */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-base font-semibold text-[var(--text)] mb-4">{t('createSchedule')}</h2>

        <div className="space-y-4">
          {/* Period Selector */}
          <div>
            <Label className="text-sm font-medium text-[var(--text-muted)]">{t('frequency')}</Label>
            <div className="flex gap-2 mt-1.5">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-dim)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                  }`}
                >
                  {t(`period.${p}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <Label className="text-sm font-medium text-[var(--text-muted)]">{t('recipients')}</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="email@example.com"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
              />
              <WarmButton size="sm" variant="secondary" onClick={addRecipient}>
                <Plus className="h-4 w-4" />
              </WarmButton>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-sm"
                  >
                    <Mail className="h-3 w-3 text-blue-500" />
                    <span className="text-blue-700">{email}</span>
                    <button
                      onClick={() => removeRecipient(email)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          <WarmButton onClick={handleSave} isLoading={saving} fullWidth>
            {t('save')}
          </WarmButton>
        </div>
      </WarmCard>

      {/* Preview info */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-base font-semibold text-[var(--text)] mb-3">{t('previewTitle')}</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          {t('previewBody')}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 bg-[var(--surface-dim)] rounded-xl text-center">
            <div className="text-xs text-[var(--text-muted)]">{t('period.daily')}</div>
            <div className="text-sm font-medium text-[var(--text)]">{t('everyMorning')}</div>
          </div>
          <div className="p-3 bg-[var(--surface-dim)] rounded-xl text-center">
            <div className="text-xs text-[var(--text-muted)]">{t('period.weekly')}</div>
            <div className="text-sm font-medium text-[var(--text)]">{t('everyMonday')}</div>
          </div>
          <div className="p-3 bg-[var(--surface-dim)] rounded-xl text-center">
            <div className="text-xs text-[var(--text-muted)]">{t('period.monthly')}</div>
            <div className="text-sm font-medium text-[var(--text)]">{t('firstOfMonth')}</div>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
