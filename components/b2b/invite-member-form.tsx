'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Roles the org invitation API accepts (excluding "owner" — ownership is
// transferred, not invited).
// Labels come from b2b.invite.roles.<value>.
const ROLE_OPTIONS = ['admin', 'finance', 'marketing', 'support', 'partner_cashier', 'auditor'] as const;

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const t = useTranslations('b2b.invite');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orgs/${orgId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ kind: 'ok', text: t('sent', { email: email.trim() }) });
        setEmail('');
        router.refresh(); // re-render the server page to show the new pending invite
      } else {
        const text =
          typeof data.error === 'string'
            ? data.error
            : t('failed');
        setMessage({ kind: 'err', text });
      }
    } catch {
      setMessage({ kind: 'err', text: t('error') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WarmCard padding="lg">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="h-5 w-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--text)]">{t('title')}</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {t(`roles.${r}`)}
            </option>
          ))}
        </select>
        <WarmButton type="submit" disabled={submitting}>
          {submitting ? t('sending') : t('submit')}
        </WarmButton>
      </form>
      {message && (
        <p className={`mt-3 text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-[var(--danger)]'}`}>
          {message.text}
        </p>
      )}
    </WarmCard>
  );
}
