'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

/**
 * Landing page for B2B org invitation links (emailed via sendOrgInvitation).
 * Accept logic lives in POST /api/orgs/invitations/accept; this page is the
 * UI that lets an invitee accept (or sign in first and return here).
 */
export default function AcceptInvitationPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleAccept = async () => {
    if (!token) return;
    setStatus('accepting');
    setMessage('');
    try {
      const res = await fetch('/api/orgs/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.status === 401) {
        const cb = encodeURIComponent(`/accept-invitation/${token}`);
        window.location.href = `/login?callbackUrl=${cb}`;
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus('done');
        setMessage(data.orgName ? `You've joined ${data.orgName}.` : 'Invitation accepted.');
        setTimeout(() => {
          window.location.href = data.orgId ? `/app/b2b/orgs/${data.orgId}` : '/app/b2b';
        }, 1200);
      } else {
        setStatus('error');
        setMessage(data.error || 'This invitation could not be accepted.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)] [background-image:var(--gradient-mesh-1),var(--gradient-mesh-2)]">
      <WarmCard padding="lg" className="max-w-md w-full text-center bg-[var(--surface)] shadow-[var(--shadow-xl)] animate-in fade-in zoom-in-95 duration-500">
        <div
          className={`w-16 h-16 rounded-[var(--r-xl)] flex items-center justify-center mx-auto mb-6 shadow-[var(--shadow-md)] ${
            status === 'error' ? 'bg-[var(--danger)]/10' : 'gradient-brand'
          }`}
        >
          {status === 'done' ? (
            <CheckCircle2 className="h-8 w-8 text-[var(--primary-foreground)]" />
          ) : status === 'error' ? (
            <AlertCircle className="h-8 w-8 text-[var(--danger)]" />
          ) : (
            <Users className="h-8 w-8 text-[var(--primary-foreground)]" />
          )}
        </div>

        {status === 'done' ? (
          <>
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Welcome aboard!</h1>
            <p className="text-[var(--text-muted)]">{message} Redirecting…</p>
          </>
        ) : status === 'error' ? (
          <>
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Invitation problem</h1>
            <p className="text-[var(--text-muted)] mb-6">{message}</p>
            <WarmButton asChild variant="secondary">
              <Link href="/app/b2b">Go to your organizations</Link>
            </WarmButton>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">You&apos;ve been invited</h1>
            <p className="text-[var(--text-muted)] mb-7">
              Accept this invitation to join the organization. You may be asked to sign in first.
            </p>
            <WarmButton onClick={handleAccept} isLoading={status === 'accepting'} disabled={!token} fullWidth size="lg">
              {status === 'accepting' ? 'Accepting…' : 'Accept invitation'}
            </WarmButton>
          </>
        )}
      </WarmCard>
    </div>
  );
}
