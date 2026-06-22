import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Claim Your Gift' };

export default async function ClaimGiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const gift = await prisma.giftedVoucher.findUnique({
    where: { token },
  });

  if (!gift) notFound();

  const session = await auth();

  if (gift.status === 'claimed') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
            Gift Already Claimed
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>This gift has already been claimed.</p>
        </div>
      </div>
    );
  }

  if (gift.status === 'expired') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
            Gift Expired
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Sorry, this gift link has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          You&apos;ve Got a Gift!
        </h1>
        {gift.giftMessage && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '1rem', margin: '1rem 0', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            &ldquo;{gift.giftMessage}&rdquo;
          </div>
        )}
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {session?.user ? 'Click below to add this voucher to your wallet.' : 'Sign in to claim this voucher.'}
        </p>
        {session?.user ? (
          <form action={`/api/gifts/claim/${token}`} method="POST">
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'var(--primary)',
                color: 'var(--text)',
                border: 'none',
                borderRadius: 'var(--r-md)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Claim Gift
            </button>
          </form>
        ) : (
          <a
            href={`/login?callbackUrl=/gifts/claim/${token}`}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.875rem',
              background: 'var(--primary)',
              color: 'var(--text)',
              border: 'none',
              borderRadius: 'var(--r-md)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '1rem',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            Sign In to Claim
          </a>
        )}
      </div>
    </div>
  );
}
