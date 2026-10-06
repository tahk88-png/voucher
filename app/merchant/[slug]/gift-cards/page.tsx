import { pageMetadata } from '@/lib/seo/page-metadata';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { StatsCard } from '@/components/ui/stats-card';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, DollarSign, Gift, TrendingUp } from 'lucide-react';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import GiftCardsListClient from './gift-cards-list-client';

export async function generateMetadata() {
  const t = await getTranslations('merchantGiftCards');
  return pageMetadata({ title: t('list.metaTitle'), noIndex: true });
}

export default async function GiftCardsListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const t = await getTranslations('nav');
  const tg = await getTranslations('merchantGiftCards.list');

  const giftCards = await prisma.giftCard.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
  });

  const totalGiftCards = giftCards.length;
  const activeGiftCards = giftCards.filter((card) => card.status === 'active').length;
  const redeemedGiftCards = giftCards.filter((card) => card.status === 'redeemed').length;
  const totalValue = giftCards.reduce((sum, card) => sum + card.amount, 0);

  const serializedGiftCards = giftCards.map((card) => ({
    ...card,
    validFrom: card.validFrom.toISOString(),
    validTo: card.validTo ? card.validTo.toISOString() : null,
    redeemedAt: card.redeemedAt ? card.redeemedAt.toISOString() : null,
    designJson: card.designJson
      ? (typeof card.designJson === 'string'
          ? card.designJson
          : JSON.stringify(card.designJson))
      : null,
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('giftCards') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text)]">{tg('title')}</h1>
              <p className="text-sm text-[var(--text-muted)]">{tg('subtitle')}</p>
            </div>
          </div>
          <WarmButton asChild>
            <Link href={`/merchant/${slug}/gift-cards/new`}>{tg('newGiftCard')}</Link>
          </WarmButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title={tg('stats.total')}
            value={totalGiftCards}
            description={tg('stats.totalDescription')}
            icon={Gift}
          />
          <StatsCard
            title={tg('stats.active')}
            value={activeGiftCards}
            description={tg('stats.activeDescription')}
            icon={TrendingUp}
          />
          <StatsCard
            title={tg('stats.redeemed')}
            value={redeemedGiftCards}
            description={tg('stats.redeemedDescription')}
            icon={CheckCircle2}
          />
          <StatsCard
            title={tg('stats.totalValue')}
            value={formatCurrency(totalValue, merchant.defaultCurrency)}
            description={tg('stats.totalValueDescription')}
            icon={DollarSign}
          />
        </div>

        <GiftCardsListClient giftCards={serializedGiftCards} merchantSlug={slug} />
      </div>
    </div>
  );
}
