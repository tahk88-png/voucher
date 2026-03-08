import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Merchants | Voucher Platform',
  description: 'Discover the most active merchants on our platform',
};

export const revalidate = 300; // 5 min cache

async function getLeaderboard() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const merchants = await prisma.merchant.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      brandLogoUrl: true,
      country: true,
      _count: { select: { redemptions: true } },
      redemptions: {
        where: { confirmedAt: { gte: thirtyDaysAgo } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return merchants
    .map(m => ({
      ...m,
      recentRedemptions: m.redemptions.length,
      totalRedemptions: m._count.redemptions,
    }))
    .sort((a, b) => b.recentRedemptions - a.recentRedemptions)
    .slice(0, 20);
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default async function LeaderboardPage() {
  const merchants = await getLeaderboard();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
            Top Merchants
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Most active merchants this month
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {merchants.map((merchant, index) => (
            <Link
              key={merchant.id}
              href={`/m/${merchant.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'box-shadow 0.15s',
                boxShadow: index < 3 ? 'var(--shadow-sm)' : 'none',
              }}>
                <div style={{
                  width: '40px',
                  textAlign: 'center',
                  fontSize: index < 3 ? '1.5rem' : '1.125rem',
                  fontWeight: 700,
                  color: index < 3 ? 'var(--primary)' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {index < 3 ? MEDALS[index] : `#${index + 1}`}
                </div>

                {merchant.brandLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={merchant.brandLogoUrl}
                    alt={merchant.name}
                    style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--r-sm)',
                    background: 'var(--primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text)', fontWeight: 700,
                    fontSize: '1.125rem', flexShrink: 0,
                  }}>
                    {merchant.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>
                    {merchant.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {merchant.country}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>
                    {merchant.recentRedemptions}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    redemptions
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {merchants.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No merchants yet. Be the first!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
