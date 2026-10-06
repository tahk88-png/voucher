import { DemoBadge } from '@/components/campaign/campaign-card';
import { campaignPriceText, getCategoryVisual, toCampaignCardData } from '@/lib/campaign-presentation';
import { pageMetadata } from '@/lib/seo/page-metadata';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Award, Flame, Link2, Sparkles, Wallet, Users, Store, Shield, Building2 } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCurrencyLocale } from '@/lib/i18n-utils';
import { isPlatformAdmin } from '@/lib/admin';
import { ATTAINABLE_BADGES } from './_components/badges';
import { getCountryByLocale, isSupportedLocale, defaultCountryCode, getCountryByCode } from '@/lib/locale-config';
import { summariseCredits } from './_components/credit-summary';

export async function generateMetadata(): Promise<Metadata> {
  const tAccount = await getTranslations('account');
  return pageMetadata({ title: tAccount('dashboard.metaTitle'), noIndex: true });
}

const CREDIT_STATUSES = ['locked', 'available', 'used', 'expired', 'reversed'] as const;
const REFERRAL_STATUSES = ['created', 'opened', 'redeemed', 'expired', 'blocked'] as const;

export default async function AppPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const locale = await getLocale();
  const intlLocale = getCurrencyLocale(locale);
  const t = await getTranslations('dashboard');
  const tLabels = await getTranslations('labels');
  const userId = session.user.id;
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { merchantMembers: { include: { merchant: true } } },
  });
  if (!user) {
    redirect('/login');
  }

  const [
    creditRows,
    totalReferrals,
    redeemedReferrals,
    streak,
    badgeCount,
    recentReferrals,
    recentCredits,
    activeCampaigns,
    orgMemberships,
  ] = await Promise.all([
    // The user's own credit, across every merchant that issued it.
    prisma.creditLedger.findMany({
      where: { userId, status: { in: ['available', 'locked'] } },
      select: { amount: true, currency: true, status: true, expiresAt: true },
    }),
    prisma.referral.count({ where: { referrerUserId: userId } }),
    prisma.referral.count({ where: { referrerUserId: userId, status: 'redeemed' } }),
    prisma.userStreak.findUnique({ where: { userId }, select: { totalPoints: true } }),
    prisma.userBadge.count({ where: { userId } }),
    prisma.referral.findMany({
      where: { referrerUserId: userId },
      include: { merchant: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.creditLedger.findMany({
      where: { userId },
      include: { merchant: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Same criteria as the public /campaigns listing.
    prisma.campaign.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
        endDate: { gte: now },
        merchant: { isActive: true },
      },
      include: {
        merchant: { select: { name: true, slug: true, city: true, defaultCurrency: true, brandLogoUrl: true } },
        _count: {
          select: {
            vouchers: { where: { status: 'published', validFrom: { lte: now }, validTo: { gte: now } } },
            purchases: { where: { status: 'paid' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.orgMembership.findMany({
      where: { userId },
      include: { org: { select: { id: true, name: true } } },
      take: 10,
    }),
  ]);

  const balances = summariseCredits(creditRows, now);
  // With no credit yet, show zero in the currency of the visitor's market (EUR by default).
  const marketCurrency = (
    isSupportedLocale(locale) ? getCountryByLocale(locale) : getCountryByCode(defaultCountryCode)
  )?.currency ?? 'EUR';
  const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(amount / 100);
  const primaryBalance = balances[0] ?? { currency: marketCurrency, available: 0, locked: 0 };
  const otherBalances = balances.slice(1);

  const checkInPoints = streak?.totalPoints ?? 0;
  const numberFormat = new Intl.NumberFormat(intlLocale);

  const creditStatusLabel = (status: string) =>
    (CREDIT_STATUSES as readonly string[]).includes(status) ? t(`creditStatus.${status}` as never) : status;
  const referralStatusLabel = (status: string) =>
    (REFERRAL_STATUSES as readonly string[]).includes(status) ? t(`referralStatus.${status}` as never) : status;

  const isAdmin = isPlatformAdmin(user.email);
  const merchantRoles = user.merchantMembers?.filter((m) => m.merchant) ?? [];
  const hasMultipleContexts = merchantRoles.length > 0 || orgMemberships.length > 0 || isAdmin;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Role cards — quick switch between contexts */}
      {hasMultipleContexts && (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app"
            aria-current="page"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[var(--primary)]/10 border-2 border-[var(--primary)] text-sm font-semibold text-[var(--primary)]"
          >
            <Award className="h-4 w-4" />
            {t('roleShopper')}
          </Link>
          {merchantRoles.map((m) => (
            <Link
              key={m.merchantId}
              href={`/merchant/${m.merchant.slug}/dashboard`}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:border-[var(--primary)] hover:shadow-warm transition"
            >
              <Store className="h-4 w-4 text-[var(--text-muted)]" />
              {m.merchant.name}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                {m.role === 'merchant_admin' ? t('roleAdmin') : t('roleStaff')}
              </span>
            </Link>
          ))}
          {orgMemberships.map((om) => (
            <Link
              key={om.org.id}
              href={`/app/b2b/orgs/${om.org.id}`}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:border-[var(--primary)] hover:shadow-warm transition"
            >
              <Building2 className="h-4 w-4 text-[var(--text-muted)]" />
              {om.org.name}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700 hover:border-red-400 hover:shadow-warm transition"
            >
              <Shield className="h-4 w-4" />
              {t('rolePlatformAdmin')}
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Credit balance: real merchant credit in its own currency, not "points". */}
        <div className="lg:col-span-2 rounded-[26px] bg-gradient-to-br from-[#fcfbf8] via-[#f6e1d7] to-[#eccab9] p-6 sm:p-8 shadow-warm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-sm text-[var(--text-faint)] font-semibold">{t('availableCredit')}</h1>
              <div className="text-4xl sm:text-6xl font-bold text-[var(--text)] mt-3 break-words">
                {formatMoney(primaryBalance.available, primaryBalance.currency)}
              </div>
              {primaryBalance.locked > 0 && (
                <div className="text-sm text-[var(--text-muted)] mt-2">
                  {t('pendingCredit', { amount: formatMoney(primaryBalance.locked, primaryBalance.currency) })}
                </div>
              )}
              {otherBalances.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-[var(--text-muted)]">
                  {otherBalances.map((b) => (
                    <li key={b.currency}>
                      {formatMoney(b.available, b.currency)}
                      {b.locked > 0 && ` · ${t('pendingCredit', { amount: formatMoney(b.locked, b.currency) })}`}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-[var(--text-faint)] mt-3 max-w-md">{t('creditExplainer')}</p>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-[18px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
              <Wallet className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-6">
            <WarmButton asChild size="sm" variant="secondary">
              <Link href="/app/cashback">{t('viewCreditDetails')}</Link>
            </WarmButton>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[24px] bg-gradient-to-br from-[#e6efe7] to-[#d8e6da] p-6 shadow-warm">
            <div className="w-12 h-12 rounded-[16px] bg-[var(--success)] text-white flex items-center justify-center mb-4">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="text-3xl font-semibold text-[var(--text)]">{numberFormat.format(redeemedReferrals)}</div>
            <div className="text-sm text-[var(--text-muted)] mt-1">{t('successfulReferrals')}</div>
          </div>

          <Link
            href="/app/achievements"
            className="block rounded-[24px] bg-gradient-to-br from-[#f6e1d7] to-[#eccab9] p-6 shadow-warm hover:shadow-warm-lg transition"
          >
            <div className="w-12 h-12 rounded-[16px] bg-[var(--primary)] text-white flex items-center justify-center mb-4">
              <Flame className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="text-3xl font-semibold text-[var(--text)]">{numberFormat.format(checkInPoints)}</div>
            <div className="text-sm text-[var(--text-muted)] mt-1">{t('checkInPoints')}</div>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)] lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 shrink-0 rounded-[16px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
                <Link2 className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[var(--text)]">{t('shareTitle')}</h2>
                <p className="text-sm text-[var(--text-muted)]">{t('shareDescription')}</p>
              </div>
            </div>
            <WarmButton asChild size="sm" className="shrink-0 self-start">
              <Link href="/app/share">{t('openShareCenter')}</Link>
            </WarmButton>
          </div>
          <div className="mt-4 rounded-[16px] bg-[#fcfbf8] border border-[rgba(139,115,85,0.15)] px-4 py-3 text-sm text-[var(--text-muted)]">
            {t('sharedSummary', { count: numberFormat.format(totalReferrals), redeemed: numberFormat.format(redeemedReferrals) })}
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-gradient-to-br from-[#fcfbf8] to-[#f6e1d7] border border-[rgba(139,115,85,0.15)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 shrink-0 rounded-[16px] bg-white flex items-center justify-center shadow-warm-sm">
              <Sparkles className="h-6 w-6 text-[var(--primary)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[var(--text)]">{t('achievementsTitle')}</h2>
              <p className="text-sm text-[var(--text-muted)]">
                {t('badgesEarned', { earned: badgeCount, total: ATTAINABLE_BADGES.length })}
              </p>
            </div>
          </div>
          <WarmButton asChild size="sm" variant="outline">
            <Link href="/app/achievements">{t('viewAchievements')}</Link>
          </WarmButton>
        </WarmCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)] lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">{t('availableOffers')}</h2>
            <WarmButton asChild size="sm" variant="outline">
              <Link href="/campaigns">{t('browseAll')}</Link>
            </WarmButton>
          </div>
          {activeCampaigns.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)]">{t('noActiveOffers')}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((campaign) => {
                const card = toCampaignCardData(campaign)
                const visual = getCategoryVisual(card.categoryId)
                return (
                  <Link
                    key={campaign.id}
                    href={card.href}
                    className="group flex flex-col rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--primary)] hover:shadow-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        aria-hidden="true"
                        className="grid h-9 w-9 place-items-center rounded-xl"
                        style={{ background: visual.gradient }}
                      >
                        <visual.icon className="h-4 w-4 text-white" />
                      </span>
                      {card.isDemo ? (
                        <DemoBadge />
                      ) : card.discountLabel ? (
                        <span className="rounded-full bg-[#2d2721] px-2.5 py-1 text-xs font-bold text-white">{card.discountLabel}</span>
                      ) : null}
                    </div>
                    <div className="mt-3 truncate text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                      {card.merchantName}
                    </div>
                    <div className="mt-1 line-clamp-2 text-base font-semibold text-[var(--text)] group-hover:text-[var(--primary)]">
                      {card.title}
                    </div>
                    <div className="mt-auto pt-3 text-sm">
                      <div className="font-bold text-[var(--text)]">{campaignPriceText(card, tLabels)}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {t('validUntil', { date: campaign.endDate.toLocaleDateString(intlLocale) })}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </WarmCard>

        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('recentActivity')}</h2>
          <div className="space-y-3">
            {recentReferrals.length === 0 && recentCredits.length === 0 && (
              <div className="text-sm text-[var(--text-muted)]">{t('noRecentActivity')}</div>
            )}
            {recentCredits.map((credit) => (
              <div key={credit.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[var(--text-muted)] min-w-0 truncate">
                  {t('creditFrom', { merchant: credit.merchant.name })} · {creditStatusLabel(credit.status)}
                </span>
                <span className="font-semibold text-[var(--text)] shrink-0">
                  {formatMoney(credit.amount, credit.currency)}
                </span>
              </div>
            ))}
            {recentReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[var(--text-muted)] min-w-0 truncate">
                  {t('referralAt', { merchant: referral.merchant.name })}
                </span>
                <span className="font-semibold text-[var(--text)] shrink-0">{referralStatusLabel(referral.status)}</span>
              </div>
            ))}
          </div>
        </WarmCard>
      </div>

      {merchantRoles.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('myMerchants')}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {merchantRoles.map((member) => (
              <WarmCard key={member.merchantId} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text)]">{member.merchant.name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      {member.role === 'merchant_admin' ? t('roleAdmin') : t('roleStaff')}
                    </p>
                  </div>
                  <WarmButton asChild className="w-full" size="sm">
                    <Link href={`/merchant/${member.merchant.slug}/dashboard`}>{t('merchantDashboard')}</Link>
                  </WarmButton>
                </div>
              </WarmCard>
            ))}
          </div>
        </div>
      ) : (
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 shrink-0 rounded-full bg-[#f6e1d7] flex items-center justify-center">
                <Store className="h-6 w-6 text-[var(--text-faint)]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text)]">{t('sellTitle')}</h2>
                <p className="text-sm text-[var(--text-muted)] max-w-md">{t('sellDescription')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <WarmButton asChild>
                <Link href="/contact">{t('contactUs')}</Link>
              </WarmButton>
              <WarmButton asChild variant="outline">
                <Link href="/campaigns">{t('exploreVouchers')}</Link>
              </WarmButton>
            </div>
          </div>
        </WarmCard>
      )}
    </div>
  );
}
