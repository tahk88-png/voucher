import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SITE_NAME } from '@/lib/seo';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Gift, Megaphone, Globe, Mail } from 'lucide-react';
import {
  CAMPAIGN_TYPE_LABELS,
  describeVoucherValue,
  formatDisplayDate,
  voucherHeadline,
  voucherTypeLabel,
} from '@/lib/voucher-display';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { slug, isActive: true },
    select: { name: true, slug: true, brandLogoUrl: true },
  });
  if (!merchant) return { title: 'Not Found' };
  const description = `Browse vouchers, campaigns, and offers from ${merchant.name}`;
  return {
    // The root layout applies a `%s | GiftHub` template, so `title` must not
    // carry a site-name suffix of its own. OG titles bypass the template.
    title: merchant.name,
    description,
    openGraph: {
      title: `${merchant.name} | ${SITE_NAME}`,
      description,
      type: 'profile',
    },
  };
}

export default async function MerchantPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = new Date();
  const merchant = await prisma.merchant.findUnique({
    where: { slug, isActive: true },
    include: {
      campaigns: {
        where: { status: 'active', endDate: { gte: now }, deletedAt: null },
        orderBy: { startDate: 'desc' },
        take: 12,
      },
      vouchers: {
        where: { status: 'published', validTo: { gte: now }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: { campaign: { select: { name: true } } },
      },
    },
  });

  if (!merchant) notFound();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          {merchant.brandLogoUrl ? (
            <Image src={merchant.brandLogoUrl} alt={merchant.name} width={64} height={64} className="rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-bold text-[var(--text)]">
              {merchant.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">{merchant.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-[var(--text-muted)]">
              {merchant.website && (
                <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--primary)]">
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
              {merchant.supportEmail && (
                <a href={`mailto:${merchant.supportEmail}`} className="flex items-center gap-1 hover:text-[var(--primary)]">
                  <Mail className="h-3.5 w-3.5" /> Contact
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-xl font-semibold text-[var(--text)]">Active Campaigns</h2>
          </div>
          {merchant.campaigns.length === 0 ? (
            <WarmCard padding="lg" className="bg-white text-center">
              <p className="text-[var(--text-muted)]">No active campaigns right now</p>
            </WarmCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {merchant.campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <WarmCard padding="md" className="bg-white hover:shadow-lg transition-shadow h-full">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-[var(--text)] line-clamp-2">{campaign.name}</h3>
                      <Badge variant="secondary">{CAMPAIGN_TYPE_LABELS[campaign.type] ?? campaign.type}</Badge>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{campaign.description}</p>
                    )}
                    <p className="text-xs text-[var(--text-faint)] mt-3">
                      {formatDisplayDate(campaign.startDate)} &ndash; {formatDisplayDate(campaign.endDate)}
                    </p>
                  </WarmCard>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Available Vouchers */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-xl font-semibold text-[var(--text)]">Available Vouchers</h2>
          </div>
          {merchant.vouchers.length === 0 ? (
            <WarmCard padding="lg" className="bg-white text-center">
              <p className="text-[var(--text-muted)]">No vouchers available right now</p>
            </WarmCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {merchant.vouchers.map((voucher) => (
                <Link key={voucher.id} href={`/v/${voucher.id}`}>
                  <WarmCard padding="md" className="bg-white hover:shadow-lg transition-shadow h-full">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-[var(--text)] line-clamp-2">
                        {voucherHeadline(voucher) || voucher.campaign?.name || describeVoucherValue(voucher)}
                      </h3>
                      <Badge variant="outline" className="shrink-0">{voucherTypeLabel(voucher.type)}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-[var(--primary)] mt-2">{describeVoucherValue(voucher)}</p>
                    <p className="text-xs text-[var(--text-faint)] mt-2">
                      Valid until {formatDisplayDate(voucher.validTo)}
                    </p>
                  </WarmCard>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
