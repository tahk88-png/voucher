import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Gift, Megaphone, Globe, Mail } from 'lucide-react';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    select: { name: true, slug: true, brandLogoUrl: true },
  });
  if (!merchant) return { title: 'Not Found' };
  return {
    title: `${merchant.name} | Voucher Platform`,
    description: `Browse vouchers, campaigns, and offers from ${merchant.name}`,
    openGraph: {
      title: `${merchant.name} | Voucher Platform`,
      description: `Browse vouchers, campaigns, and offers from ${merchant.name}`,
      type: 'profile',
    },
  };
}

export default async function MerchantPublicPage({ params }: { params: { slug: string } }) {
  const now = new Date();
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      campaigns: {
        where: { status: 'active', endDate: { gte: now } },
        orderBy: { startDate: 'desc' },
        take: 12,
      },
      vouchers: {
        where: { status: 'published', validTo: { gte: now } },
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
                      <Badge variant="secondary">{campaign.type}</Badge>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{campaign.description}</p>
                    )}
                    <p className="text-xs text-[var(--text-faint)] mt-3">
                      {new Date(campaign.startDate).toLocaleDateString()} &ndash; {new Date(campaign.endDate).toLocaleDateString()}
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
                <WarmCard key={voucher.id} padding="md" className="bg-white">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-[var(--text)]">
                      {voucher.campaign?.name || 'Voucher'}
                    </h3>
                    <Badge variant="outline">
                      {voucher.type === 'percentage' ? 'Discount' : voucher.type === 'credit_amount' ? 'Credit' : 'Fixed'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--primary)] mt-2">
                    {voucher.type === 'percentage'
                      ? `${voucher.value / 100}% off`
                      : `${(voucher.value / 100).toFixed(2)} ${voucher.currency}`}
                  </p>
                  <p className="text-xs text-[var(--text-faint)] mt-2">
                    Valid until {new Date(voucher.validTo).toLocaleDateString()}
                  </p>
                </WarmCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
