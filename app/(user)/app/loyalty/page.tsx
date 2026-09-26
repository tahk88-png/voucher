import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Loyalty', noIndex: true });

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Crown, Wallet, Trophy } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { getCurrencyLocale } from '@/lib/i18n-utils';

/**
 * Loyalty tiers (lib/loyalty-tiers.ts) are defined but not wired up: no flow
 * credits LoyaltyAccount points and checkout applies no tier discount, free
 * shipping or early access. Showing tiers and benefits would promise things the
 * platform doesn't do, so this page says so and points to the rewards that are
 * real (referral credit, check-in points). Any points already on the account
 * (e.g. manual adjustments) are still listed.
 */
export default async function LoyaltyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const t = await getTranslations('loyalty');
  const locale = await getLocale();
  const intlLocale = getCurrencyLocale(locale);

  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId: session.user.id },
    include: { pointsHistory: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  const history = account?.pointsHistory ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-7 w-7 text-[var(--primary)]" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-[var(--text)]">{t('title')}</h1>
      </div>

      <WarmCard padding="lg" className="bg-white space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">{t('notActiveTitle')}</h2>
        <p className="text-sm text-[var(--text-muted)]">{t('notActiveBody')}</p>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">{t('earnTodayTitle')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--r-md)] border border-[var(--border)] p-4 space-y-3">
            <div className="flex items-center gap-2 font-medium text-[var(--text)]">
              <Wallet className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
              {t('earnCreditTitle')}
            </div>
            <p className="text-sm text-[var(--text-muted)]">{t('earnCreditBody')}</p>
            <WarmButton asChild size="sm" variant="outline">
              <Link href="/app/cashback">{t('earnCreditLink')}</Link>
            </WarmButton>
          </div>
          <div className="rounded-[var(--r-md)] border border-[var(--border)] p-4 space-y-3">
            <div className="flex items-center gap-2 font-medium text-[var(--text)]">
              <Trophy className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
              {t('earnPointsTitle')}
            </div>
            <p className="text-sm text-[var(--text-muted)]">{t('earnPointsBody')}</p>
            <WarmButton asChild size="sm" variant="outline">
              <Link href="/app/achievements">{t('earnPointsLink')}</Link>
            </WarmButton>
          </div>
        </div>
      </WarmCard>

      {account && (account.totalPoints !== 0 || history.length > 0) && (
        <WarmCard padding="lg" className="bg-white space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-[var(--text)]">{t('historyTitle')}</h2>
            <span className="text-sm text-[var(--text-muted)]">
              {t('pointsBalance', { points: account.totalPoints.toLocaleString(intlLocale) })}
            </span>
          </div>
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-[var(--border)] last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text)] truncate">{entry.description || entry.reason}</p>
                  <p className="text-xs text-[var(--text-muted)]">{entry.createdAt.toLocaleDateString(intlLocale)}</p>
                </div>
                <span className={`text-sm font-semibold ${entry.points > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {entry.points > 0 ? '+' : ''}
                  {entry.points}
                </span>
              </div>
            ))}
          </div>
        </WarmCard>
      )}
    </div>
  );
}
