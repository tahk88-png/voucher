import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { formatCurrency, formatPercentage, safeParseJson } from "@/lib/utils"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { Calendar, CheckCircle2, Clock, Gift, MapPin, ShoppingBag, Ticket } from "lucide-react"
import { isMerchantActive } from "@/lib/merchant-status"
import { setRequestLocale } from "next-intl/server"
import { routing, Link } from "@/routing"
import { getCampaignCategoryId } from "@/lib/campaign-categories"
import CampaignShareButton from "../campaign-share-button"
import { buildLocaleAlternates, DEFAULT_OG_IMAGE, SITE_NAME, getLocalePath } from "@/lib/seo"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string } | Promise<{ locale: string; id: string }>
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
  params: { locale: string; id: string } | Promise<{ locale: string; id: string }>
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
          defaultCurrency: true,
          brandLogoUrl: true,
          brandColorsJson: true,
          website: true,
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

  const discountRules = safeParseJson<{ type: string; value: number; currency?: string }>(
    campaign.discountRules
  )
  const brandColors = safeParseJson<Record<string, string>>(campaign.merchant.brandColorsJson)
  const accent = brandColors?.primary || "#E17B5C"
  const categoryId = getCampaignCategoryId({
    name: campaign.name,
    description: campaign.description,
  })
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const voucherLink =
    campaign.vouchers.length > 0
      ? `${baseUrl}/v/${campaign.vouchers[0].id}`
      : `${baseUrl}/campaigns/${campaign.id}`

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="bg-white/80 backdrop-blur-sm border-b border-[rgba(139,115,85,0.15)] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-sm text-[#8B7355]">
          <Link href="/campaigns" className="hover:text-[#2D2721]">
            Campaigns
          </Link>
          <span>/</span>
          <span className="text-[#2D2721] font-medium truncate max-w-[220px]">{campaign.name}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-3xl overflow-hidden aspect-video shadow-warm-lg group">
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent} 0%, #F5C98E 100%)` }}
              >
                <Gift className="h-20 w-20 text-white/80" />
              </div>
              <div className="absolute bottom-6 left-6 text-white bg-black/40 backdrop-blur p-4 rounded-xl">
                <h1 className="text-2xl font-bold mb-1">{campaign.name}</h1>
                <p>{campaign.merchant.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden aspect-[4/3] shadow-sm cursor-pointer hover:shadow-warm transition-all bg-[#F8F6F1] flex items-center justify-center"
                >
                  <Ticket className="h-8 w-8 text-[#8B7355]" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <WarmCard padding="lg" className="sticky top-24 bg-white">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[rgba(139,115,85,0.15)]/50">
                <div className="w-14 h-14 rounded-full bg-[#FAF7F2] flex items-center justify-center text-2xl border border-[rgba(139,115,85,0.15)]">
                  {campaign.merchant.brandLogoUrl ? (
                    <Image
                      src={campaign.merchant.brandLogoUrl}
                      alt={campaign.merchant.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Gift className="h-6 w-6 text-[#E17B5C]" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#2D2721]">{campaign.merchant.name}</h3>
                  <div className="flex items-center gap-1 text-[#9DB5A5] text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Verified partner
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-[#2D2721]">
                    {campaign.price && campaign.price > 0
                      ? formatCurrency(campaign.price, campaign.merchant.defaultCurrency)
                      : "FREE"}
                  </span>
                </div>
                {discountRules && discountRules.type && (
                  <span className="text-sm font-bold text-[#E17B5C] bg-[#FFF9ED] px-2 py-1 rounded-md">
                    {discountRules.type === "percentage"
                      ? formatPercentage(discountRules.value)
                      : formatCurrency(
                          discountRules.value,
                          discountRules.currency || campaign.merchant.defaultCurrency
                        )}{" "}
                    discount
                  </span>
                )}
              </div>

              <WarmButton asChild fullWidth size="lg" className="mb-3">
                <Link href={`/campaigns/${campaign.id}?category=${categoryId}`}>
                  <span className="inline-flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Add to cart
                  </span>
                </Link>
              </WarmButton>

              <CampaignShareButton url={voucherLink} title={campaign.name} />

              <div className="mt-6 pt-6 border-t border-[rgba(139,115,85,0.15)]/50 space-y-3 text-sm text-[#6B5744]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#E17B5C] flex-shrink-0" />
                  <span>{campaign.merchant.website || "Merchant location"}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#E17B5C] flex-shrink-0" />
                  <div className="flex flex-col">
                    <span>Campaign runs</span>
                    <span className="font-semibold text-[#2D2721]">
                      {new Date(campaign.startDate).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      -{" "}
                      {new Date(campaign.endDate).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </WarmCard>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-[#2D2721] mb-4">Offer details</h2>
              <p className="text-[#6B5744] leading-relaxed whitespace-pre-line">
                {campaign.description || "Special offer from a verified merchant partner."}
              </p>
            </section>

            <section id="vouchers" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#2D2721] mb-6 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-[#E17B5C]" />
                Vouchers
              </h2>
              <div className="space-y-4">
                {campaign.vouchers.length === 0 ? (
                  <WarmCard padding="lg" className="bg-white">
                    <p className="text-[#6B5744]">No vouchers available right now.</p>
                  </WarmCard>
                ) : (
                  campaign.vouchers.map((voucher) => {
                    const design = safeParseJson<Record<string, any>>(voucher.designJson)
                    return (
                      <WarmCard key={voucher.id} padding="lg" hover className="bg-white">
                        <div className="flex flex-col sm:flex-row justify-between gap-6">
                          <div>
                            <h3 className="text-lg font-bold text-[#2D2721] mb-2">
                              {design?.headline || "Voucher offer"}
                            </h3>
                            <p className="text-[#6B5744] mb-4">
                              {voucher.type === "percentage"
                                ? `${formatPercentage(voucher.value)} discount`
                                : `${formatCurrency(voucher.value, voucher.currency)} credit`}
                            </p>
                            <div className="font-bold text-[#2D2721] text-xl">
                              {campaign.price && campaign.price > 0
                                ? formatCurrency(campaign.price, campaign.merchant.defaultCurrency)
                                : "FREE"}
                            </div>
                          </div>
                          <div className="flex flex-col justify-center sm:w-40">
                            <WarmButton asChild>
                              <Link href={`/v/${voucher.id}`}>View voucher</Link>
                            </WarmButton>
                          </div>
                        </div>
                      </WarmCard>
                    )
                  })
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <WarmCard padding="lg" className="bg-white">
              <h3 className="text-lg font-bold text-[#2D2721] mb-4">Campaign stats</h3>
              <div className="space-y-3 text-sm text-[#6B5744]">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span>{campaign._count.vouchers} vouchers available</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>{campaign._count.purchases} purchases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Ends{" "}
                    {new Date(campaign.endDate).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </WarmCard>
          </div>
        </div>
      </main>
    </div>
  )
}
