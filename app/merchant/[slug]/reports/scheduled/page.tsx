'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function ScheduledReportsPage() {
  const params = useParams();
  const slug = params.slug as string;

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
      setError('Invalid email address');
      return;
    }
    if (recipients.includes(email)) {
      setError('Email already added');
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
      setError('Add at least one recipient');
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
        setSuccess('Report schedule saved successfully');
        setRecipients([]);
        fetchSchedules();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to save schedule');
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
          <h1 className="text-2xl font-semibold text-[var(--text)]">Scheduled Reports</h1>
          <p className="text-sm text-[var(--text-muted)]">Configure automatic email reports</p>
        </div>
        <Link href={`/merchant/${slug}/reports`}>
          <WarmButton variant="outline" size="sm">
            ← Financial Reports
          </WarmButton>
        </Link>
      </div>

      {/* Existing Schedules */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-base font-semibold text-[var(--text)] mb-4">Active Schedules</h2>
        {loading ? (
          <div className="text-sm text-[var(--text-muted)]">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No schedules configured yet</p>
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
                      {PERIOD_LABELS[s.period]} Report
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {s.recipients.length} recipient{s.recipients.length !== 1 ? 's' : ''}
                      {s.lastSentAt && (
                        <> &bull; Last sent: {new Date(s.lastSentAt).toLocaleDateString()}</>
                      )}
                      {s.nextRunAt && (
                        <> &bull; Next: {new Date(s.nextRunAt).toLocaleDateString()}</>
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
                    {s.enabled ? 'Pause' : 'Resume'}
                  </WarmButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </WarmCard>

      {/* New Schedule Form */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-base font-semibold text-[var(--text)] mb-4">Create Schedule</h2>

        <div className="space-y-4">
          {/* Period Selector */}
          <div>
            <Label className="text-sm font-medium text-[var(--text-muted)]">Frequency</Label>
            <div className="flex gap-2 mt-1.5">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-dim)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <Label className="text-sm font-medium text-[var(--text-muted)]">Recipients</Label>
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
            Save Schedule
          </WarmButton>
        </div>
      </WarmCard>

      {/* Preview info */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-base font-semibold text-[var(--text)] mb-3">Report Preview</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Scheduled reports include revenue, redemption counts, top vouchers, and growth metrics.
          Reports are sent as beautifully formatted HTML emails at 8:00 AM UTC.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 bg-[var(--surface-dim)] rounded-xl text-center">
            <div className="text-xs text-[var(--text-muted)]">Daily</div>
            <div className="text-sm font-medium text-[var(--text)]">Every morning</div>
          </div>
          <div className="p-3 bg-[var(--surface-dim)] rounded-xl text-center">
            <div className="text-xs text-[var(--text-muted)]">Weekly</div>
            <div className="text-sm font-medium text-[var(--text)]">Every Monday</div>
          </div>
          <div className="p-3 bg-[var(--surface-dim)] rounded-xl text-center">
            <div className="text-xs text-[var(--text-muted)]">Monthly</div>
            <div className="text-sm font-medium text-[var(--text)]">1st of each month</div>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
