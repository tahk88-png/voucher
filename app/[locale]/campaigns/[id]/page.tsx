import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatPercentage, safeParseJson } from "@/lib/utils"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { ArrowRight, CheckCircle2, Clock, Globe, Info, MapPin, QrCode, ShoppingBag, Store, Ticket } from "lucide-react"
import { CampaignCard, CampaignCover, DemoBadge } from "@/components/campaign/campaign-card"
import { toCampaignCardData } from "@/lib/campaign-presentation"
import { isMerchantActive } from "@/lib/merchant-status"
import { isDemoMerchantSlug } from "@/lib/demo-content"
import { setRequestLocale } from "next-intl/server"
import { routing, Link } from "@/routing"
import CampaignShareButton from "../campaign-share-button"
import { ReviewList } from "@/components/reviews/review-list"
import { auth } from "@/lib/auth"
import { buildLocaleAlternates, DEFAULT_OG_IMAGE, SITE_NAME, getLocalePath } from "@/lib/seo"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const p = await Promise.resolve(params)
  let locale = p?.locale
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  const now = new Date()
  const campaign = await prisma.campaign.findUnique({
    where: { id: p.id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      updatedAt: true,
      merchant: {
        select: {
          name: true,
          slug: true,
          brandLogoUrl: true,
        },
      },
    },
  })

  if (!campaign || campaign.status !== "active" || campaign.startDate > now || campaign.endDate < now) {
    return {
      title: "Campaign unavailable",
      robots: { index: false, follow: false },
    }
  }

  const title = campaign.name
  const description = campaign.description || `Offer from ${campaign.merchant.name}.`
  const canonicalPath = getLocalePath(locale, `/campaigns/${campaign.id}`)
  const imageUrl = campaign.merchant.brandLogoUrl || DEFAULT_OG_IMAGE

  return {
    title,
    description,
    // Demo campaigns (scripts/demo-content.cjs) are shown to visitors as
    // labelled samples but must not be indexed as real offers.
    ...(isDemoMerchantSlug(campaign.merchant.slug) ? { robots: { index: false, follow: false } } : {}),
    alternates: {
      canonical: canonicalPath,
      languages: buildLocaleAlternates(`/campaigns/${campaign.id}`),
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalPath,
      locale,
      siteName: SITE_NAME,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const p = await Promise.resolve(params)
  let locale = p?.locale
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }
  setRequestLocale(locale)

  const now = new Date()
  const campaign = await prisma.campaign.findUnique({
    where: { id: p.id },
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          defaultCurrency: true,
          brandLogoUrl: true,
          website: true,
          onboardedAt: true,
        },
      },
      vouchers: {
        where: {
          status: "published",
          validFrom: { lte: now },
          validTo: { gte: now },
        },
        select: {
          id: true,
          type: true,
          value: true,
          currency: true,
          designJson: true,
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          vouchers: {
            where: {
              status: "published",
              validFrom: { lte: now },
              validTo: { gte: now },
            },
          },
          purchases: {
            where: {
              status: "paid",
            },
          },
        },
      },
    },
  })

  if (!campaign) {
    notFound()
  }

  if (campaign.status !== "active" || campaign.startDate > now || campaign.endDate < now) {
    notFound()
  }

  try {
    const active = await isMerchantActive(campaign.merchantId)
    if (!active) {
      notFound()
    }
  } catch {
    notFound()
  }

  const session = await auth()
  const signedIn = Boolean(session?.user?.id)

  const card = toCampaignCardData(campaign)
  const isDemo = card.isDemo
  // Buying happens through a published, currently valid voucher.
  const onSale = campaign.vouchers.length > 0 && !isDemo
  let websiteHost: string | null = null
  if (campaign.merchant.website) {
    try {
      const url = new URL(campaign.merchant.website)
      if (url.protocol === "http:" || url.protocol === "https:") {
        websiteHost = url.hostname.replace(/^www\./, "")
      }
    } catch {
      websiteHost = null // not a valid absolute URL: don't render a broken link
    }
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const voucherLink =
    campaign.vouchers.length > 0
      ? `${baseUrl}/v/${campaign.vouchers[0].id}`
      : `${baseUrl}/campaigns/${campaign.id}`

  // Other live offers from the same merchant, as a way to keep browsing.
  const moreFromMerchant = await prisma.campaign
    .findMany({
      where: {
        merchantId: campaign.merchantId,
        id: { not: campaign.id },
        status: "active",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        merchant: { select: { name: true, slug: true, city: true, defaultCurrency: true, brandLogoUrl: true } },
        _count: {
          select: {
            vouchers: { where: { status: "published", validFrom: { lte: now }, validTo: { gte: now } } },
            purchases: { where: { status: "paid" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    })
    .catch(() => [])

  const dateRange = `${new Date(campaign.startDate).toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${new Date(campaign.endDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`
  const merchantHref = `/m/${campaign.merchant.slug}`

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Not sticky: the site header is the sticky bar. */}
      <nav aria-label="Breadcrumb" className="border-b border-[var(--border)] bg-[var(--surface)]/80">
        <ol className="mx-auto flex max-w-7xl min-w-0 items-center gap-2 px-4 py-3 text-sm text-[var(--text-muted)] sm:px-6 lg:px-8">
          <li>
            <Link href="/campaigns" className="hover:text-[var(--text)]">
              Campaigns
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="min-w-0 truncate font-medium text-[var(--text)]">
            {card.title}
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {isDemo && (
          <div
            role="note"
            className="mb-6 flex items-start gap-3 rounded-[var(--r-md)] border border-[var(--border)] border-l-4 border-l-[color:var(--warning)] bg-[var(--surface)] p-4 text-sm text-[var(--text)]"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
            <p>
              <strong>Sample offer.</strong> This page shows how an offer looks on GiftHub. The business and offer
              are examples: nothing here can be bought or redeemed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="min-w-0 space-y-8 lg:col-span-2">
            <CampaignCover
              categoryId={card.categoryId}
              imageUrl={card.imageUrl}
              alt={card.merchantName}
              className="aspect-[16/9] rounded-3xl shadow-warm-lg sm:aspect-[2/1]"
              iconClassName="h-16 w-16 sm:h-20 sm:w-20"
              sizes="(max-width: 1024px) 100vw, 800px"
            >
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#2d2721] shadow-sm backdrop-blur">
                {card.categoryLabel}
              </span>
              {card.discountLabel && (
                <span className="absolute right-4 top-4 rounded-full bg-[#2d2721] px-3.5 py-1.5 text-base font-bold text-white shadow-md">
                  {card.discountLabel}
                </span>
              )}
              {isDemo && <DemoBadge className="absolute bottom-4 left-4" />}
            </CampaignCover>

            <header>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-[var(--text-muted)]">
                <Link href={merchantHref} className="font-bold uppercase tracking-wide text-[var(--primary)] hover:underline">
                  {card.merchantName}
                </Link>
                {card.merchantCity && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {card.merchantCity}
                  </span>
                )}
                {campaign.merchant.onboardedAt && !isDemo && (
                  <span className="inline-flex items-center gap-1 text-[var(--success)]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Verified partner
                  </span>
                )}
              </p>
              <h1 className="mt-2 break-words text-3xl font-bold leading-tight text-[var(--text)] sm:text-4xl">{card.title}</h1>
            </header>

            <section aria-labelledby="offer-details">
              <h2 id="offer-details" className="mb-3 text-xl font-bold text-[var(--text)]">
                About this offer
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-[var(--text-muted)]">
                {campaign.description || "Special offer from a merchant on GiftHub."}
              </p>
            </section>

            <section aria-labelledby="how-it-works">
              <h2 id="how-it-works" className="mb-4 text-xl font-bold text-[var(--text)]">
                How it works
              </h2>
              <ol className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: ShoppingBag, title: card.isFree ? "Claim the voucher" : "Buy the voucher", text: "Pay securely online, or claim it for free when the offer is free." },
                  { icon: QrCode, title: "Get your QR code", text: "The voucher is saved in your GiftHub wallet with a personal QR code." },
                  { icon: Store, title: "Show it on site", text: `${card.merchantName} scans the code and the discount is applied.` },
                ].map((step, index) => (
                  <li key={step.title} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]">
                        {index + 1}
                      </span>
                      <step.icon className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-[var(--text)]">{step.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            {campaign.terms && (
              <section aria-labelledby="offer-terms">
                <h2 id="offer-terms" className="mb-3 text-xl font-bold text-[var(--text)]">
                  Terms
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">{campaign.terms}</p>
              </section>
            )}

            {onSale && campaign.vouchers.length > 1 && (
              <section id="vouchers" aria-labelledby="voucher-options" className="scroll-mt-24">
                <h2 id="voucher-options" className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--text)]">
                  <Ticket className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
                  Voucher options
                </h2>
                <div className="space-y-3">
                  {campaign.vouchers.map((voucher) => {
                    const design = safeParseJson<{ headline?: string }>(voucher.designJson)
                    return (
                      <WarmCard key={voucher.id} padding="md" hover className="bg-[var(--surface)]">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div>
                            <h3 className="font-bold text-[var(--text)]">{design?.headline || "Voucher"}</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                              {voucher.type === "percentage"
                                ? `${formatPercentage(voucher.value)} discount`
                                : `${formatCurrency(voucher.value, voucher.currency)} credit`}
                            </p>
                          </div>
                          <WarmButton asChild size="sm">
                            <Link href={`/v/${voucher.id}`}>View voucher</Link>
                          </WarmButton>
                        </div>
                      </WarmCard>
                    )
                  })}
                </div>
              </section>
            )}

            <section aria-labelledby="reviews-heading">
              <h2 id="reviews-heading" className="mb-4 text-xl font-bold text-[var(--text)]">
                Reviews
              </h2>
              <WarmCard padding="lg" className="bg-[var(--surface)]">
                <ReviewList campaignId={campaign.id} signedIn={signedIn} />
              </WarmCard>
            </section>
          </div>

          <aside className="space-y-6" aria-label="Purchase">
            <WarmCard padding="lg" className="bg-[var(--surface)] lg:sticky lg:top-24">
              <div className="mb-5">
                <div className="text-3xl font-bold text-[var(--text)]">{card.priceLabel}</div>
                {card.discountLabel && (
                  <p className="mt-1 text-sm font-semibold text-[var(--primary)]">{card.discountLabel.replace("−", "")} discount</p>
                )}
              </div>

              {/* Buying happens on the voucher page (/v/[id]). With no voucher on
                  sale (none published yet, or a demo campaign) there is nothing to buy. */}
              {onSale ? (
                <WarmButton asChild fullWidth size="lg" className="mb-3">
                  <Link href={`/v/${campaign.vouchers[0].id}`}>
                    <span className="inline-flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      {campaign.price ? "Buy now" : "Get free voucher"}
                    </span>
                  </Link>
                </WarmButton>
              ) : (
                <div className="mb-3" role="status">
                  <WarmButton fullWidth size="lg" disabled aria-describedby="not-on-sale-reason">
                    {isDemo ? "Sample offer" : "Not on sale yet"}
                  </WarmButton>
                  <p id="not-on-sale-reason" className="mt-2 text-sm text-[var(--text-muted)]">
                    {isDemo
                      ? "This is example content, so it can't be bought."
                      : `${card.merchantName} hasn’t published a voucher for this offer yet. Check back later.`}
                  </p>
                </div>
              )}

              <CampaignShareButton url={voucherLink} title={card.title} />

              <dl className="mt-6 space-y-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-muted)]">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                  <div>
                    <dt>Offer runs</dt>
                    <dd className="font-semibold text-[var(--text)]">{dateRange}</dd>
                  </div>
                </div>
                {campaign._count.purchases > 0 && (
                  <div className="flex items-start gap-3">
                    <ShoppingBag className="h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                    <div>
                      <dt>Bought</dt>
                      <dd className="font-semibold text-[var(--text)]">
                        {campaign._count.purchases} {campaign._count.purchases === 1 ? "time" : "times"}
                      </dd>
                    </div>
                  </div>
                )}
                {websiteHost && (
                  <div className="flex min-w-0 items-start gap-3">
                    <Globe className="h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt>Website</dt>
                      <dd>
                        <a
                          href={campaign.merchant.website!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all font-semibold text-[var(--text)] underline underline-offset-2"
                        >
                          {websiteHost}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
              </dl>

              <Link
                href={merchantHref}
                className="mt-5 flex items-center justify-between gap-3 rounded-[var(--r-md)] border border-[var(--border)] p-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-dim)]"
              >
                <span className="min-w-0 truncate">All offers from {card.merchantName}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </WarmCard>
          </aside>
        </div>

        {moreFromMerchant.length > 0 && (
          <section aria-labelledby="more-offers" className="mt-14">
            <h2 id="more-offers" className="mb-5 text-2xl font-bold text-[var(--text)]">
              More from {card.merchantName}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {moreFromMerchant.map((other) => (
                <CampaignCard key={other.id} campaign={toCampaignCardData(other)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
