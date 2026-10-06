'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
// What the page says after a response: a stable kind (translated at render)
// or the server's own error text.
type InvitationMessage =
  | { kind: 'joined'; orgName: string }
  | { kind: 'accepted' }
  | { kind: 'notAccepted' }
  | { kind: 'generic' }
  | { kind: 'server'; text: string };

export default function AcceptInvitationPage() {
  const t = useTranslations('authPages.acceptInvitation');
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<InvitationMessage | null>(null);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('accepting');
    setMessage(null);
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
        setMessage(data.orgName ? { kind: 'joined', orgName: String(data.orgName) } : { kind: 'accepted' });
        setTimeout(() => {
          window.location.href = data.orgId ? `/app/b2b/orgs/${data.orgId}` : '/app/b2b';
        }, 1200);
      } else {
        setStatus('error');
        setMessage(data.error ? { kind: 'server', text: String(data.error) } : { kind: 'notAccepted' });
      }
    } catch {
      setStatus('error');
      setMessage({ kind: 'generic' });
    }
  };

  const messageText = (() => {
    switch (message?.kind) {
      case 'joined':
        return t('joined', { orgName: message.orgName });
      case 'accepted':
        return t('accepted');
      case 'notAccepted':
        return t('errorNotAccepted');
      case 'generic':
        return t('errorGeneric');
      case 'server':
        return message.text;
      default:
        return '';
    }
  })();

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
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">{t('welcomeTitle')}</h1>
            <p className="text-[var(--text-muted)]">{messageText || t('accepted')}</p>
          </>
        ) : status === 'error' ? (
          <>
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">{t('problemTitle')}</h1>
            <p className="text-[var(--text-muted)] mb-6">{messageText}</p>
            <WarmButton asChild variant="secondary">
              <Link href="/app/b2b">{t('goToOrgs')}</Link>
            </WarmButton>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">{t('invitedTitle')}</h1>
            <p className="text-[var(--text-muted)] mb-7">
              {t('invitedDesc')}
            </p>
            <WarmButton onClick={handleAccept} isLoading={status === 'accepting'} disabled={!token} fullWidth size="lg">
              {status === 'accepting' ? t('accepting') : t('accept')}
            </WarmButton>
          </>
        )}
      </WarmCard>
    </div>
  );
}
