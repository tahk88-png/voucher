'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { UserPlus } from 'lucide-react';

// Roles the org invitation API accepts (excluding "owner" — ownership is
// transferred, not invited).
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Support' },
  { value: 'partner_cashier', label: 'Partner Cashier' },
  { value: 'auditor', label: 'Auditor' },
];

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const router = useRouter();
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
        setMessage({ kind: 'ok', text: `Invitation sent to ${email.trim()}.` });
        setEmail('');
        router.refresh(); // re-render the server page to show the new pending invite
      } else {
        const text =
          typeof data.error === 'string'
            ? data.error
            : 'Could not send the invitation. Please check the email and try again.';
        setMessage({ kind: 'err', text });
      }
    } catch {
      setMessage({ kind: 'err', text: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WarmCard padding="lg">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="h-5 w-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--text)]">Invite a member</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@example.com"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <WarmButton type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send invite'}
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
