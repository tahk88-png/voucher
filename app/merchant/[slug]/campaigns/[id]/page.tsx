import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { formatPrice } from '@/lib/currency-constants';
import { normalizeCurrency } from '@/lib/money-input';
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_HELP,
  CAMPAIGN_TYPE_LABELS,
  formatDisplayDate,
  formatVoucherCode,
  voucherDisplayName,
  voucherStatusLabel,
} from '@/lib/voucher-display';
import CampaignStatusActions from './campaign-status-actions';
import GenerateVouchersButton from './generate-vouchers-button';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import CampaignPromotionForm from './campaign-promotion-form';

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  let access;
  try {
    access = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) redirect('/login');
    notFound();
  }
  const merchant = await prisma.merchant.findUnique({
    where: { id: access.merchant.id },
    select: { id: true, defaultCurrency: true },
  });
  if (!merchant) notFound();
  // effectiveRole accounts for platform admins as well as the membership role.
  const isAdmin = access.effectiveRole === 'merchant_admin';
  const currency = normalizeCurrency(merchant.defaultCurrency);

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      merchant: {
        select: { defaultCurrency: true },
      },
      vouchers: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          vouchers: true,
          purchases: true,
        },
      },
    },
  });

  if (!campaign || campaign.merchantId !== merchant.id || campaign.deletedAt) {
    notFound();
  }

  const t = await getTranslations('nav');

  const paidPurchases = await prisma.voucherPurchase.count({
    where: {
      campaignId: campaign.id,
      status: 'paid',
    },
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('campaigns'), href: `/merchant/${slug}/campaigns` },
            { label: campaign.name },
          ]}
        />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--text)] break-words">{campaign.name}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {campaign.description || 'No description'}
            </p>
            <p className="text-xs text-[var(--text-faint)] mt-1">
              {formatDisplayDate(campaign.startDate)} – {formatDisplayDate(campaign.endDate)}
            </p>
          </div>
          <CampaignStatusActions
            campaignId={campaign.id}
            merchantSlug={slug}
            status={campaign.status}
            isAdmin={isAdmin}
          />
        </div>

        {campaign.status === 'draft' && (
          <p className="mb-6 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text-muted)]">
            This campaign is a draft, so customers can&apos;t see it yet.{isAdmin ? ' Publish it when you are ready.' : ''}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {[
            { label: 'Status', value: CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status },
            {
              label: 'Type',
              value: CAMPAIGN_TYPE_LABELS[campaign.type] ?? campaign.type,
              hint: CAMPAIGN_TYPE_HELP[campaign.type as 'limited' | 'weekly'],
            },
            {
              label: 'Price',
              value: campaign.price !== null && campaign.price > 0 ? formatPrice(campaign.price, currency, 'en-GB') : 'Free',
            },
            {
              label: 'Referrer credit',
              value: campaign.creditPercentage ? `${Number((campaign.creditPercentage / 100).toFixed(2))}%` : 'None',
            },
          ].map((item) => (
            <WarmCard key={item.label} padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-faint)]">{item.label}</p>
              <p className="text-lg font-semibold text-[var(--text)] mt-2">{item.value}</p>
              {'hint' in item && item.hint && <p className="text-xs text-[var(--text-muted)] mt-1">{item.hint}</p>}
            </WarmCard>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {[
            { label: 'Vouchers', value: campaign._count.vouchers },
            { label: 'Total purchases', value: campaign._count.purchases },
            { label: 'Paid purchases', value: paidPurchases },
          ].map((item) => (
            <WarmCard key={item.label} padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-faint)]">{item.label}</p>
              <p className="text-2xl font-semibold text-[var(--text)] mt-2">{item.value}</p>
            </WarmCard>
          ))}
        </div>

        {campaign.terms && (
          <WarmCard padding="lg" className="mb-6 bg-[var(--surface)] border border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text)]">Terms and conditions</h2>
            <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap mt-2">{campaign.terms}</p>
          </WarmCard>
        )}

        {isAdmin && (
          <WarmCard padding="lg" className="mb-6 bg-[var(--surface)] border border-[var(--border)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Promotion</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Paid visibility for weekly newsletter and notifications.
              </p>
            </div>
            <div className="mt-4">
              <CampaignPromotionForm
                campaignId={campaign.id}
                initial={{
                  promotedWeeklyEmail: campaign.promotedWeeklyEmail,
                  promotedNotification: campaign.promotedNotification,
                  promotedUntil: campaign.promotedUntil ? campaign.promotedUntil.toISOString() : null,
                }}
              />
            </div>
          </WarmCard>
        )}

        <WarmCard padding="lg" className="relative bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">Vouchers</h2>
              <p className="text-sm text-[var(--text-muted)]">Vouchers generated from this campaign.</p>
            </div>
            {isAdmin && (
            <div className="relative">
              <GenerateVouchersButton
                campaignId={campaign.id}
                merchantSlug={slug}
                campaign={{
                  name: campaign.name,
                  startDate: campaign.startDate.toISOString(),
                  endDate: campaign.endDate.toISOString(),
                  price: campaign.price,
                  merchant: campaign.merchant,
                }}
              />
            </div>
            )}
          </div>
          <div className="mt-4">
            {campaign.vouchers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--text-muted)] text-sm mb-4">No vouchers generated yet.</p>
                {isAdmin && (
                <GenerateVouchersButton
                  campaignId={campaign.id}
                  merchantSlug={slug}
                  campaign={{
                    name: campaign.name,
                    startDate: campaign.startDate.toISOString(),
                    endDate: campaign.endDate.toISOString(),
                    price: campaign.price,
                    merchant: { defaultCurrency: merchant.defaultCurrency },
                  }}
                />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {campaign.vouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex items-center justify-between gap-3 p-3 border border-[var(--border)] rounded-lg bg-[var(--bg)]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text)] truncate">{voucherDisplayName(voucher)}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        <span className="font-mono">{formatVoucherCode(voucher)}</span> · {voucherStatusLabel(voucher.status)}
                      </p>
                    </div>
                    <WarmButton asChild variant="outline" size="sm">
                      <Link href={`/merchant/${slug}/vouchers/${voucher.id}`}>View</Link>
                    </WarmButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
