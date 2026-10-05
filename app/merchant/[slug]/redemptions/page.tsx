import { pageMetadata } from '@/lib/seo/page-metadata';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('merchantStore');
  return pageMetadata({ title: t('redemptions.metaTitle'), noIndex: true });
}

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
import { CheckCircle2, Clock, Gift, TrendingUp } from 'lucide-react';

export default async function RedemptionsPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const tr = await getTranslations('merchantStore.redemptions');

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
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('redemptions') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{t('redemptions')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{tr('subtitle')}</p>
          </div>
          {redemptions.length > 0 && <ExportRedemptionsButton merchantSlug={slug} />}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={tr('stats.totalTitle')}
            value={totalRedemptions}
            description={tr('stats.totalDescription')}
            icon={TrendingUp}
          />
          <StatsCard
            title={tr('stats.pendingTitle')}
            value={pendingRedemptions}
            description={tr('stats.pendingDescription')}
            icon={Clock}
          />
          <StatsCard
            title={tr('stats.confirmedTitle')}
            value={confirmedRedemptions}
            description={tr('stats.confirmedDescription')}
            icon={CheckCircle2}
          />
          <StatsCard
            title={tr('stats.discountsTitle')}
            value={formatCurrency(discountTotal, merchant.defaultCurrency)}
            description={tr('stats.discountsDescription')}
            icon={Gift}
          />
        </div>

        {redemptions.length === 0 ? (
          <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-[var(--bg)] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[var(--text-faint)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-2">{tr('empty.title')}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {tr('empty.description')}
                </p>
              </div>
            </div>
          </WarmCard>
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption) => {
              const design = safeParseJson<{ headline?: string }>(redemption.voucher?.designJson);
              const headline = design?.headline ?? tr('voucherFallback');
              return (
                <WarmCard key={redemption.id} padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--text)]">
                        {tr('card.order', {
                          amount: formatCurrency(redemption.amountBeforeDiscount, redemption.currency),
                        })}
                      </h2>
                      <p className="text-sm text-[var(--text-muted)]">
                        {redemption.referral
                          ? tr('card.discountReferred', {
                              amount: formatCurrency(redemption.discountApplied, redemption.currency),
                              name: redemption.referral.referrer.name || redemption.referral.referrer.email,
                            })
                          : tr('card.discount', {
                              amount: formatCurrency(redemption.discountApplied, redemption.currency),
                            })}
                      </p>
                      <p className="text-xs text-[var(--text-faint)] mt-1">{headline}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        redemption.confirmedAt
                          ? 'bg-[#9DB5A5]/30 text-[var(--text)]'
                          : 'bg-[#FFE5B4] text-[var(--text-muted)]'
                      }`}
                    >
                      {redemption.confirmedAt ? tr('card.confirmed') : tr('card.pending')}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--text-muted)] mt-4 space-y-1">
                    <p>
                      {tr('card.method', {
                        method:
                          redemption.method === 'online' || redemption.method === 'in_store'
                            ? tr(`card.methods.${redemption.method}`)
                            : redemption.method,
                      })}
                    </p>
                    <p>{tr('card.orderReference', { reference: redemption.orderReference || tr('card.notAvailable') })}</p>
                    {redemption.location && <p>{tr('card.location', { location: redemption.location })}</p>}
                    <p>
                      {tr('card.date', {
                        date: new Date(redemption.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
                      })}
                    </p>
                  </div>
                  {!redemption.confirmedAt && (
                    <div className="mt-4">
                      <ConfirmRedemptionButton
                        redemptionId={redemption.id}
                        merchantSlug={slug}
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
