import { pageMetadata } from '@/lib/seo/page-metadata';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { StatsCard } from '@/components/ui/stats-card';
import { CheckCircle2, Gift, Ticket, TrendingUp } from 'lucide-react';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import VouchersListClient from './vouchers-list-client';

export async function generateMetadata() {
  const t = await getTranslations('merchantVouchers');
  return pageMetadata({ title: t('list.metaTitle'), noIndex: true });
}

export default async function VouchersListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const t = await getTranslations('nav');
  const tVoucher = await getTranslations('voucher');
  const tPage = await getTranslations('merchantVouchers.list');

  const vouchers = await prisma.voucher.findMany({
    where: { merchantId: merchant.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { redemptions: true } } },
  });

  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter((voucher) => voucher.status === 'published').length;
  const draftVouchers = vouchers.filter((voucher) => voucher.status === 'draft').length;
  const pausedVouchers = vouchers.filter((voucher) => voucher.status === 'paused').length;
  const endedVouchers = vouchers.filter((voucher) => voucher.status === 'ended' || voucher.status === 'expired').length;
  const totalRedemptions = vouchers.reduce((sum, voucher) => sum + voucher._count.redemptions, 0);

  // Serialize dates to strings and designJson for client component
  const serializedVouchers = vouchers.map((voucher) => ({
    ...voucher,
    validFrom: voucher.validFrom.toISOString(),
    validTo: voucher.validTo.toISOString(),
    designJson: voucher.designJson
      ? (typeof voucher.designJson === 'string'
          ? voucher.designJson
          : JSON.stringify(voucher.designJson))
      : null,
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('vouchers') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text)]">{t('vouchers')}</h1>
              <p className="text-sm text-[var(--text-muted)]">{tPage('subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <WarmButton asChild variant="outline">
              <Link href={`/merchant/${slug}/vouchers/bulk-import`}>{tPage('bulkImport')}</Link>
            </WarmButton>
            <WarmButton asChild>
              <Link href={`/merchant/${slug}/vouchers/new`}>{tVoucher('create')}</Link>
            </WarmButton>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
          <StatsCard
            title={tPage('stats.totalTitle')}
            value={totalVouchers}
            description={tPage('stats.totalDescription')}
            icon={Gift}
          />
          <StatsCard
            title={tPage('stats.activeTitle')}
            value={activeVouchers}
            description={tPage('stats.activeDescription')}
            icon={TrendingUp}
          />
          <StatsCard
            title={tPage('stats.draftsTitle')}
            value={draftVouchers}
            description={tPage('stats.draftsDescription')}
            icon={Ticket}
          />
          <StatsCard
            title={tPage('stats.pausedEndedTitle')}
            value={pausedVouchers + endedVouchers}
            description={tPage('stats.pausedEndedDescription', { paused: pausedVouchers, ended: endedVouchers })}
            icon={Gift}
          />
          <StatsCard
            title={tPage('stats.redemptionsTitle')}
            value={totalRedemptions}
            description={tPage('stats.redemptionsDescription')}
            icon={CheckCircle2}
          />
        </div>

        <VouchersListClient vouchers={serializedVouchers} merchantSlug={slug} />
      </div>
    </div>
  );
}
