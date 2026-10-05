import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { SITE_NAME } from '@/lib/seo';
import { isDemoMerchantSlug } from '@/lib/demo-content';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Gift, Globe, Info, Mail, MapPin, Tag } from 'lucide-react';
import HubShell from '@/components/layout/hub-shell';
import { CampaignCard, DemoBadge } from '@/components/campaign/campaign-card';
import { getCategoryVisual, stripDemoMarker, toCampaignCardData } from '@/lib/campaign-presentation';
import {
  DISPLAY_LOCALE,
  formatDisplayDate,
  formatVoucherValue,
  voucherHeadline,
} from '@/lib/voucher-display';

const VOUCHER_TYPES = ['percentage', 'fixed_amount', 'credit_amount'];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { slug, isActive: true },
    select: { name: true, slug: true, brandLogoUrl: true },
  });
  const t = await getTranslations('directory.merchantPage');
  if (!merchant) return { title: t('notFoundTitle') };
  const name = stripDemoMarker(merchant.name, isDemoMerchantSlug(merchant.slug));
  const description = t('metaDescription', { name });
  return {
    // The root layout applies a `%s | GiftHub` template, so `title` must not
    // carry a site-name suffix of its own. OG titles bypass the template.
    title: merchant.name,
    description,
    // Demo merchants (scripts/demo-content.cjs) are labelled samples, not real businesses.
    ...(isDemoMerchantSlug(merchant.slug) ? { robots: { index: false, follow: false } } : {}),
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
  const liveVoucherWhere = { status: 'published', validFrom: { lte: now }, validTo: { gte: now } };
  const merchant = await prisma.merchant.findUnique({
    where: { slug, isActive: true },
    include: {
      campaigns: {
        // Same "live" definition as the campaign page, so every card opens.
        where: { status: 'active', startDate: { lte: now }, endDate: { gte: now }, deletedAt: null },
        orderBy: { startDate: 'desc' },
        take: 12,
        include: {
          _count: {
            select: {
              vouchers: { where: liveVoucherWhere },
              purchases: { where: { status: 'paid' } },
            },
          },
        },
      },
      vouchers: {
        // Vouchers sold outside any campaign; campaign vouchers are reached through their campaign card.
        where: { ...liveVoucherWhere, campaignId: null, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: { campaign: { select: { name: true } } },
      },
    },
  });

  if (!merchant) notFound();

  const t = await getTranslations('directory.merchantPage');
  const tLabels = await getTranslations('labels');
  const locale = await getLocale();
  // English keeps the existing en-GB date style; other locales format natively.
  const dateLocale = locale === 'en' ? DISPLAY_LOCALE : locale;
  const typeLabel = (type: string) =>
    VOUCHER_TYPES.includes(type.toLowerCase()) ? tLabels(`voucherType.${type.toLowerCase()}`) : type.replace(/_/g, ' ');
  const valueLabel = (voucher: { type: string; value: number; currency: string }) =>
    tLabels(voucher.type.toLowerCase() === 'credit_amount' ? 'valueCredit' : 'valueOff', {
      value: formatVoucherValue(voucher),
    });
  const isDemo = isDemoMerchantSlug(merchant.slug);
  const displayName = stripDemoMarker(merchant.name, isDemo);
  const cards = merchant.campaigns.map((campaign) =>
    toCampaignCardData({
      ...campaign,
      merchant: {
        name: merchant.name,
        slug: merchant.slug,
        city: merchant.city,
        defaultCurrency: merchant.defaultCurrency,
        brandLogoUrl: merchant.brandLogoUrl,
      },
    })
  );
  // The banner takes the look of the merchant's main category.
  const banner = getCategoryVisual(cards[0]?.categoryId ?? 'other');
  const offerCount = cards.length + merchant.vouchers.length;

  return (
    <HubShell>
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section aria-labelledby="merchant-name" className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-warm-sm">
            <div className="relative h-28 sm:h-40" style={{ background: banner.gradient }} aria-hidden="true">
              <banner.icon className="absolute -bottom-10 right-6 h-44 w-44 rotate-[-12deg] text-white/15 stroke-[1.25]" />
            </div>
            <div className="px-5 pb-6 sm:px-8">
              {/* relative: keeps the overlapping logo above the (positioned) banner. */}
              <div className="relative -mt-10 sm:-mt-12">
                {merchant.brandLogoUrl ? (
                  <Image
                    src={merchant.brandLogoUrl}
                    alt=""
                    width={96}
                    height={96}
                    className="h-20 w-20 rounded-2xl border-4 border-[var(--surface)] object-cover shadow-warm sm:h-24 sm:w-24"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-[var(--surface)] bg-[var(--primary)] text-2xl font-bold text-[var(--primary-foreground)] shadow-warm sm:h-24 sm:w-24">
                    {initials(displayName)}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 id="merchant-name" className="break-words text-2xl font-bold text-[var(--text)] sm:text-3xl">
                      {displayName}
                    </h1>
                    {isDemo && <DemoBadge />}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
                    {(merchant.address || merchant.city) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {[merchant.address, merchant.city].filter(Boolean).join(', ')}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('offerCount', { count: offerCount })}
                    </span>
                  </p>
                </div>
                {(merchant.website || merchant.supportEmail) && !isDemo && (
                  <div className="flex flex-wrap gap-2">
                    {merchant.website && (
                      <WarmButton asChild variant="outline" size="sm">
                        <a href={merchant.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="mr-1.5 h-4 w-4" aria-hidden="true" /> {t('website')}
                        </a>
                      </WarmButton>
                    )}
                    {merchant.supportEmail && (
                      <WarmButton asChild variant="outline" size="sm">
                        <a href={`mailto:${merchant.supportEmail}`}>
                          <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" /> {t('contact')}
                        </a>
                      </WarmButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {isDemo && (
            <p
              role="note"
              className="mt-6 flex items-start gap-3 rounded-[var(--r-md)] border border-[var(--border)] border-l-4 border-l-[color:var(--warning)] bg-[var(--surface)] p-4 text-sm text-[var(--text)]"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
              <span>
                {t.rich('sampleNotice', { strong: (chunks) => <strong>{chunks}</strong> })}
              </span>
            </p>
          )}

          <section aria-labelledby="merchant-offers" className="mt-10">
            <h2 id="merchant-offers" className="mb-5 text-2xl font-bold text-[var(--text)]">
              {t('offersHeading')}
            </h2>
            {cards.length === 0 && merchant.vouchers.length === 0 ? (
              <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
                <Gift className="mx-auto mb-3 h-8 w-8 text-[var(--text-faint)]" aria-hidden="true" />
                <p className="font-semibold text-[var(--text)]">{t('noOffers')}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{t('noOffersHint', { name: displayName })}</p>
                <WarmButton asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/campaigns">{t('browseOther')}</Link>
                </WarmButton>
              </WarmCard>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                  <CampaignCard key={card.id} campaign={card} />
                ))}
                {merchant.vouchers.map((voucher) => (
                  <Link
                    key={voucher.id}
                    href={`/v/${voucher.id}`}
                    className="group rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    <WarmCard padding="lg" className="h-full bg-[var(--surface)] transition-shadow group-hover:shadow-warm">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 font-semibold text-[var(--text)]">
                          {voucherHeadline(voucher) || voucher.campaign?.name || valueLabel(voucher)}
                        </h3>
                        <Badge variant="outline" className="shrink-0">{typeLabel(voucher.type)}</Badge>
                      </div>
                      <p className="mt-3 text-2xl font-bold text-[var(--primary)]">{valueLabel(voucher)}</p>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">{t('validUntil', { date: formatDisplayDate(voucher.validTo, dateLocale) })}</p>
                    </WarmCard>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </HubShell>
  );
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
