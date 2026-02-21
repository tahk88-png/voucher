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

export default async function VouchersListPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug: params.slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const t = await getTranslations('nav');
  const tVoucher = await getTranslations('voucher');

  const vouchers = await prisma.voucher.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { redemptions: true } } },
  });

  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter((voucher) => voucher.status === 'published').length;
  const draftVouchers = vouchers.filter((voucher) => voucher.status === 'draft').length;
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
            { label: t('dashboard'), href: `/merchant/${params.slug}/dashboard` },
            { label: t('vouchers') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Ticket className="h-6 w-6 text-[#2D2721]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#2D2721]">{t('vouchers')}</h1>
              <p className="text-sm text-[#6B5744]">Manage and create vouchers</p>
            </div>
          </div>
          <div className="flex gap-2">
            <WarmButton asChild variant="outline">
              <Link href={`/merchant/${params.slug}/vouchers/bulk-import`}>Bulk Import CSV</Link>
            </WarmButton>
            <WarmButton asChild>
              <Link href={`/merchant/${params.slug}/vouchers/new`}>{tVoucher('create')}</Link>
            </WarmButton>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total vouchers"
            value={totalVouchers}
            description="All created vouchers"
            icon={Gift}
          />
          <StatsCard
            title="Active"
            value={activeVouchers}
            description="Published vouchers"
            icon={TrendingUp}
          />
          <StatsCard
            title="Drafts"
            value={draftVouchers}
            description="Not yet published"
            icon={Ticket}
          />
          <StatsCard
            title="Redemptions"
            value={totalRedemptions}
            description="Total redemptions"
            icon={CheckCircle2}
          />
        </div>

        <VouchersListClient vouchers={serializedVouchers} merchantSlug={params.slug} />
      </div>
    </div>
  );
}
