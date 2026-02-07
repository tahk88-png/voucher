import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { formatCurrency, safeParseJson } from '@/lib/utils';
import { WarmCard } from '@/components/warm-card';
import { StatsCard } from '@/components/ui/stats-card';
import ConfirmRedemptionButton from './confirm-button';
import ExportRedemptionsButton from './export-button';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, Clock, Gift, TrendingUp } from 'lucide-react';

export default async function RedemptionsPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug },
  });

  if (!merchant) {
    notFound();
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const t = await getTranslations('nav');

  const [
    redemptions,
    totalRedemptions,
    pendingRedemptions,
    confirmedRedemptions,
    totalDiscounts,
  ] = await Promise.all([
    prisma.redemption.findMany({
      where: { merchantId: merchant.id },
      include: {
        voucher: true,
        referral: {
          include: {
            referrer: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.redemption.count({
      where: { merchantId: merchant.id },
    }),
    prisma.redemption.count({
      where: { merchantId: merchant.id, confirmedAt: null },
    }),
    prisma.redemption.count({
      where: { merchantId: merchant.id, confirmedAt: { not: null } },
    }),
    prisma.redemption.aggregate({
      where: { merchantId: merchant.id, confirmedAt: { not: null } },
      _sum: { discountApplied: true },
    }),
  ]);

  const discountTotal = totalDiscounts._sum.discountApplied ?? 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${params.slug}/dashboard` },
            { label: t('redemptions') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2721]">{t('redemptions')}</h1>
            <p className="text-sm text-[#6B5744]">View and confirm voucher redemptions.</p>
          </div>
          {redemptions.length > 0 && <ExportRedemptionsButton merchantSlug={params.slug} />}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total redemptions"
            value={totalRedemptions}
            description="All submitted redemptions"
            icon={TrendingUp}
          />
          <StatsCard
            title="Pending"
            value={pendingRedemptions}
            description="Awaiting confirmation"
            icon={Clock}
          />
          <StatsCard
            title="Confirmed"
            value={confirmedRedemptions}
            description="Approved redemptions"
            icon={CheckCircle2}
          />
          <StatsCard
            title="Discounts given"
            value={formatCurrency(discountTotal, merchant.defaultCurrency)}
            description="Confirmed discounts"
            icon={Gift}
          />
        </div>

        {redemptions.length === 0 ? (
          <WarmCard padding="lg" className="bg-white text-center">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#8B7355]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2D2721] mb-2">No redemptions yet</h3>
                <p className="text-sm text-[#6B5744]">
                  Redemptions will appear here when customers use vouchers.
                </p>
              </div>
            </div>
          </WarmCard>
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption) => {
              const design = safeParseJson<{ headline?: string }>(redemption.voucher?.designJson);
              const headline = design?.headline ?? 'Voucher';
              return (
                <WarmCard key={redemption.id} padding="lg" className="bg-white border border-[#E7DCC7]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[#2D2721]">
                        {formatCurrency(redemption.amountBeforeDiscount, redemption.currency)} order
                      </h2>
                      <p className="text-sm text-[#6B5744]">
                        Discount: {formatCurrency(redemption.discountApplied, redemption.currency)}
                        {redemption.referral && (
                          <> - Referred by {redemption.referral.referrer.name || redemption.referral.referrer.email}</>
                        )}
                      </p>
                      <p className="text-xs text-[#8B7355] mt-1">{headline}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        redemption.confirmedAt
                          ? 'bg-[#9DB5A5]/30 text-[#2D2721]'
                          : 'bg-[#FFE5B4] text-[#6B5744]'
                      }`}
                    >
                      {redemption.confirmedAt ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                  <div className="text-sm text-[#6B5744] mt-4 space-y-1">
                    <p>Method: {redemption.method}</p>
                    <p>Order: {redemption.orderReference || 'N/A'}</p>
                    {redemption.location && <p>Location: {redemption.location}</p>}
                    <p>Date: {new Date(redemption.createdAt).toLocaleString()}</p>
                  </div>
                  {!redemption.confirmedAt && (
                    <div className="mt-4">
                      <ConfirmRedemptionButton
                        redemptionId={redemption.id}
                        merchantSlug={params.slug}
                      />
                    </div>
                  )}
                </WarmCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
