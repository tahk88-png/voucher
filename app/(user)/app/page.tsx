import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Award, Flame, Link2, Sparkles, Wallet, Users } from 'lucide-react';
import { getCreditBalance } from '@/lib/credits';
import { getLocale } from 'next-intl/server';
import { getCurrencyLocale } from '@/lib/i18n-utils';

const getVoucherHeadline = (designJson: unknown) => {
  if (!designJson || typeof designJson !== 'object') {
    return 'Special Voucher';
  }

  return (designJson as { headline?: string }).headline ?? 'Special Voucher';
};

export default async function AppPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const locale = await getLocale();
  const intlLocale = getCurrencyLocale(locale);
  const sessionUser = session.user;
  const userId = sessionUser.id;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      merchantMembers: {
        include: {
          merchant: true,
        },
      },
    },
  });
  if (!user) {
    redirect('/login');
  }

  let totalReferrals = 0;
  let redeemedReferrals = 0;
  try {
    const referralStats = await prisma.referral.groupBy({
      by: ['status'],
      where: {
        referrerUserId: session.user.id,
      },
      _count: true,
    });
    totalReferrals = referralStats.reduce((sum, stat) => sum + stat._count, 0);
    redeemedReferrals = referralStats.find((stat) => stat.status === 'redeemed')?._count || 0;
  } catch (error) {
    try {
      totalReferrals = await prisma.referral.count({
        where: { referrerUserId: session.user.id },
      });
      redeemedReferrals = await prisma.referral.count({
        where: {
          referrerUserId: session.user.id,
          status: 'redeemed',
        },
      });
    } catch {
      totalReferrals = 0;
      redeemedReferrals = 0;
    }
  }

  let totalAvailable = 0;
  let totalLocked = 0;
  let currency = 'USD';
  const now = new Date();
  const merchantMembersWithId = (user.merchantMembers ?? []).filter(
    (member): member is typeof member & { merchant: { id: string } } =>
      typeof member.merchant?.id === 'string'
  );

  const balances = await Promise.all(
    merchantMembersWithId.map(async (member) => {
      try {
        return await getCreditBalance(userId, member.merchant!.id);
      } catch {
        return null;
      }
    })
  );

  for (const balance of balances) {
    if (!balance) continue;
    totalAvailable += balance.available;
    totalLocked += balance.locked;
    if (balance.currency) {
      currency = balance.currency;
    }
  }

  const pointsBalance = totalAvailable;
  const targetPoints = 2500;
  const pointsToNext = Math.max(0, targetPoints - pointsBalance);
  const progressPercent =
    targetPoints > 0 ? Math.min(100, Math.round((pointsBalance / targetPoints) * 100)) : 0;
  const totalEarned = totalAvailable + totalLocked;
  const totalEarnedFormatted = new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(totalEarned / 100);
  const rewardTargetLabel = new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(25);
  const pointsFormatted = new Intl.NumberFormat(intlLocale).format(pointsBalance);
  const streakDays = redeemedReferrals ? Math.min(30, redeemedReferrals) : 0;

  const [recentReferrals, recentCredits, featuredVouchers] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerUserId: session.user.id },
      include: { merchant: true, voucher: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.creditLedger.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.voucher.findMany({
      where: {
        status: 'published',
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      include: {
        merchant: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[26px] bg-gradient-to-br from-[#FFF9ED] via-[#FFEED1] to-[#FFE5B4] p-6 sm:p-8 shadow-warm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-sm text-[#8B7355] font-semibold">Your Points Balance</div>
              <div className="text-5xl sm:text-6xl font-bold text-[#2D2721] mt-3">{pointsFormatted}</div>
              <div className="text-sm text-[#8B7355] mt-3">
                {pointsToNext > 0 ? `${pointsToNext} points to next reward` : 'Reward unlocked'}
              </div>
            </div>
            <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Award className="h-7 w-7 text-[#2D2721]" />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-[#8B7355] mb-2">
              <span>Progress to {rewardTargetLabel} Voucher</span>
              <span className="font-semibold text-[#E17B5C]">{progressPercent}%</span>
            </div>
            <div className="h-3 rounded-full bg-[#F4E7CF] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFC857] to-[#FFB627]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[24px] bg-gradient-to-br from-[#E9F3EC] to-[#DDEDE4] p-6 shadow-warm">
            <div className="w-12 h-12 rounded-[16px] bg-[#9DB5A5] text-white flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <div className="text-3xl font-semibold text-[#2D2721]">{redeemedReferrals}</div>
            <div className="text-sm text-[#6B5744] mt-1">Successful Referrals</div>
          </div>

          <div className="rounded-[24px] bg-gradient-to-br from-[#FFE3DD] to-[#FFD2C9] p-6 shadow-warm">
            <div className="w-12 h-12 rounded-[16px] bg-[#E17B5C] text-white flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="text-3xl font-semibold text-[#2D2721]">{totalEarnedFormatted}</div>
            <div className="text-sm text-[#6B5744] mt-1">Total Earned</div>
          </div>

          <div className="rounded-[24px] bg-gradient-to-br from-[#FFF0D8] to-[#FFE2BF] p-6 shadow-warm">
            <div className="w-12 h-12 rounded-[16px] bg-[#FFB627] text-white flex items-center justify-center mb-4">
              <Flame className="h-6 w-6" />
            </div>
            <div className="text-3xl font-semibold text-[#2D2721]">{streakDays}</div>
            <div className="text-sm text-[#6B5744] mt-1">Day Streak</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                <Link2 className="h-6 w-6 text-[#2D2721]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2D2721]">Your Referral Link</h3>
                <p className="text-sm text-[#6B5744]">Share campaigns and earn bonus credits.</p>
              </div>
            </div>
            <WarmButton asChild size="sm">
              <Link href="/app/share">Open Share Center</Link>
            </WarmButton>
          </div>
          <div className="rounded-[16px] bg-[#FFF9ED] border border-[#F0E2C9] px-4 py-3 text-sm text-[#6B5744]">
            You have shared {totalReferrals} campaigns and earned {totalEarnedFormatted} so far.
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] border border-[rgba(139,115,85,0.15)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-[16px] bg-white flex items-center justify-center shadow-warm-sm">
              <Sparkles className="h-6 w-6 text-[#E17B5C]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#2D2721]">Achievements</h3>
              <p className="text-sm text-[#6B5744]">Keep sharing to unlock more.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'First Share', active: totalReferrals > 0 },
              { label: '10 Referrals', active: totalReferrals >= 10 },
              { label: 'Week Streak', active: streakDays >= 7 },
              { label: '1000 Points', active: pointsBalance >= 1000 },
            ].map((badge) => (
              <div
                key={badge.label}
                className={`rounded-[12px] px-3 py-2 text-center font-semibold ${
                  badge.active ? 'bg-white text-[#2D2721]' : 'bg-white/60 text-[#8B7355]'
                }`}
              >
                {badge.label}
              </div>
            ))}
          </div>
        </WarmCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2D2721]">Available Rewards</h2>
            <WarmButton asChild size="sm" variant="outline">
              <Link href="/campaigns">Browse all</Link>
            </WarmButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredVouchers.length === 0 ? (
              <div className="col-span-full text-sm text-[#6B5744]">
                No active vouchers available yet.
              </div>
            ) : (
              featuredVouchers.map((voucher) => (
                <WarmCard key={voucher.id} padding="md" className="bg-[#FFF9ED] border border-[#F0E2C9]">
                  <div className="text-xs uppercase tracking-wide text-[#8B7355] font-semibold">
                    {voucher.merchant?.name || 'Merchant'}
                  </div>
                  <div className="text-base font-semibold text-[#2D2721] mt-1">
                    {getVoucherHeadline(voucher.designJson)}
                  </div>
                  <div className="text-sm text-[#6B5744] mt-2">
                    Valid until {voucher.validTo.toLocaleDateString(intlLocale)}
                  </div>
                </WarmCard>
              ))
            )}
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentReferrals.length === 0 && recentCredits.length === 0 && (
              <div className="text-sm text-[#6B5744]">No recent activity yet.</div>
            )}
            {recentCredits.map((credit) => (
              <div key={credit.id} className="flex items-center justify-between text-sm">
                <span className="text-[#6B5744]">Credit {credit.status}</span>
                <span className="font-semibold text-[#2D2721]">
                  {new Intl.NumberFormat(intlLocale, { style: 'currency', currency: credit.currency }).format(
                    credit.amount / 100
                  )}
                </span>
              </div>
            ))}
            {recentReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between text-sm">
                <span className="text-[#6B5744]">
                  Referral - {referral.merchant?.name || 'Merchant'}
                </span>
                <span className="font-semibold text-[#2D2721]">{referral.status}</span>
              </div>
            ))}
          </div>
        </WarmCard>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2D2721]">My merchants</h2>
          <WarmButton asChild size="sm" variant="outline">
            <Link href="/campaigns">Explore campaigns</Link>
          </WarmButton>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {user?.merchantMembers.map((member) => (
            <WarmCard key={member.merchantId} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D2721]">{member.merchant.name}</h3>
                  <p className="text-sm text-[#6B5744]">Role: {member.role}</p>
                </div>
                <div className="space-y-2">
                  <WarmButton asChild className="w-full" size="sm">
                    <Link href={`/app/${member.merchant.slug}/wallet`}>View wallet</Link>
                  </WarmButton>
                  <WarmButton asChild variant="outline" className="w-full" size="sm">
                    <Link href={`/app/${member.merchant.slug}/vouchers`}>Browse vouchers</Link>
                  </WarmButton>
                  {member.role === 'merchant_admin' || member.role === 'merchant_staff' ? (
                    <WarmButton asChild variant="outline" className="w-full" size="sm">
                      <Link href={`/merchant/${member.merchant.slug}/dashboard`}>Merchant dashboard</Link>
                    </WarmButton>
                  ) : null}
                </div>
              </div>
            </WarmCard>
          ))}

          {(!user?.merchantMembers || user.merchantMembers.length === 0) && (
            <WarmCard padding="lg" className="md:col-span-2 lg:col-span-3 bg-white">
              <div className="flex flex-col items-center gap-4 text-center py-10">
                <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center">
                  <Users className="h-8 w-8 text-[#8B7355]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2D2721] mb-2">
                    You are not a member of any merchants yet
                  </h3>
                  <p className="text-sm text-[#6B5744] mb-4 max-w-md">
                    Contact a merchant to get started, or check your email for an invitation.
                  </p>
                </div>
                <WarmButton asChild variant="outline">
                  <Link href="/">Explore vouchers</Link>
                </WarmButton>
              </div>
            </WarmCard>
          )}
        </div>
      </div>
    </div>
  );
}

