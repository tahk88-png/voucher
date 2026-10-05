import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { formatCurrency, safeParseJson } from '@/lib/utils';
import { WarmCard } from '@/components/warm-card';
import { StatsCard } from '@/components/ui/stats-card';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getLocale, getTranslations } from 'next-intl/server';
import { CheckCircle2, Gift, TrendingUp, Users } from 'lucide-react';

const REFERRAL_STATUSES = ['created', 'opened', 'redeemed', 'expired', 'blocked'] as const;
type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

function isReferralStatus(status: string): status is ReferralStatus {
  return (REFERRAL_STATUSES as readonly string[]).includes(status);
}

const statusStyles: Record<string, string> = {
  created: 'bg-[#F2EDE3] text-[var(--text-muted)]',
  opened: 'bg-[#f3e6c9] text-[#8a6420]',
  redeemed: 'bg-[#6fae73] text-white',
  expired: 'bg-[#E5E7EB] text-[#6B7280]',
  blocked: 'bg-[var(--danger)] text-white',
};

export default async function ReferralsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
  });

  if (!merchant) {
    notFound();
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const t = await getTranslations('nav');
  const tr = await getTranslations('merchantTeam.referrals');
  const locale = await getLocale();
  const statusLabel = (status: string) => (isReferralStatus(status) ? tr(`status.${status}`) : status);

  const [
    totalReferrals,
    openedReferrals,
    redeemedReferrals,
    topReferrers,
    referralStats,
    referralCredits,
    recentReferrals,
  ] = await Promise.all([
    prisma.referral.count({
      where: { merchantId: merchant.id },
    }),
    prisma.referral.count({
      where: {
        merchantId: merchant.id,
        status: { in: ['opened', 'redeemed'] },
      },
    }),
    prisma.referral.count({
      where: {
        merchantId: merchant.id,
        status: 'redeemed',
      },
    }),
    prisma.referral.groupBy({
      by: ['referrerUserId'],
      where: { merchantId: merchant.id },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.referral.groupBy({
      by: ['status'],
      where: { merchantId: merchant.id },
      _count: { id: true },
    }),
    prisma.creditLedger.aggregate({
      where: { merchantId: merchant.id, source: 'referral_redemption' },
      _sum: { amount: true },
    }),
    prisma.referral.findMany({
      where: { merchantId: merchant.id },
      include: {
        referrer: { select: { name: true, email: true } },
        voucher: { select: { designJson: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const topReferrerIds = topReferrers.map((referrer) => referrer.referrerUserId);
  const topReferrerUsers = await prisma.user.findMany({
    where: { id: { in: topReferrerIds } },
    select: { id: true, name: true, email: true },
  });

  const conversionRate = totalReferrals > 0
    ? ((redeemedReferrals / totalReferrals) * 100).toFixed(1)
    : '0.0';

  const creditsIssued = referralCredits._sum.amount ?? 0;
  const statusMax = referralStats.reduce((max, stat) => Math.max(max, stat._count.id), 0);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('referrals') },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{tr('title')}</h1>
          <p className="text-sm text-[var(--text-muted)]">{tr('subtitle')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={tr('stats.total')}
            value={totalReferrals}
            description={tr('stats.totalHint')}
            icon={Users}
          />
          <StatsCard
            title={tr('stats.opened')}
            value={openedReferrals}
            description={tr('stats.openedHint')}
            icon={TrendingUp}
          />
          <StatsCard
            title={tr('stats.redeemed')}
            value={redeemedReferrals}
            description={tr('stats.redeemedHint')}
            icon={CheckCircle2}
          />
          <StatsCard
            title={tr('stats.conversionRate')}
            value={`${conversionRate}%`}
            description={tr('stats.conversionRateHint')}
            icon={Gift}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">{tr('statusBreakdown')}</h2>
                <p className="text-sm text-[var(--text-muted)]">{tr('creditsIssued', { amount: formatCurrency(creditsIssued, merchant.defaultCurrency) })}</p>
              </div>
            </div>
            {referralStats.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">{tr('noActivity')}</p>
            ) : (
              <div className="space-y-3">
                {referralStats.map((stat) => {
                  const pct = statusMax > 0 ? (stat._count.id / statusMax) * 100 : 0;
                  const label = statusLabel(stat.status);
                  return (
                    <div key={stat.status}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-muted)]">{label}</span>
                        <span className="font-semibold text-[var(--text)]">{stat._count.id}</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-[#F2EDE3] overflow-hidden">
                        <div className="h-full rounded-full bg-[#cc785c]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </WarmCard>

          <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)] lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">{tr('topReferrers')}</h2>
                <p className="text-sm text-[var(--text-muted)]">{tr('topReferrersHint')}</p>
              </div>
            </div>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">{tr('noReferrals')}</p>
            ) : (
              <div className="space-y-3">
                {topReferrers.map((referrer) => {
                  const user = topReferrerUsers.find((item) => item.id === referrer.referrerUserId);
                  return (
                    <div key={referrer.referrerUserId} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">
                          {user?.name || user?.email || tr('unknownUser')}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {tr('referralCount', { count: referrer._count.id })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </WarmCard>
        </div>

        <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">{tr('recent')}</h2>
              <p className="text-sm text-[var(--text-muted)]">{tr('recentHint')}</p>
            </div>
          </div>
          {recentReferrals.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">{tr('noRecent')}</p>
          ) : (
            <div className="space-y-3">
              {recentReferrals.map((referral) => {
                const design = safeParseJson<{ headline?: string }>(referral.voucher?.designJson);
                const headline = design?.headline ?? tr('voucherFallback');
                const label = statusLabel(referral.status);
                const statusClass = statusStyles[referral.status] || statusStyles.created;
                return (
                  <div
                    key={referral.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-[12px] bg-[#FFFBF5]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">
                        {referral.referrer?.name || referral.referrer?.email || tr('unknownUser')}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{headline}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                        {label}
                      </span>
                      <span className="text-xs text-[var(--text-faint)]">
                        {new Date(referral.createdAt).toLocaleDateString(locale, { dateStyle: 'medium' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
