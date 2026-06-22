import type { Metadata } from "next"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { formatCurrency, formatPercentage, safeParseJson } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { Search, Sparkles, ShoppingBag, Ticket, Gift } from "lucide-react"
import { campaignCategories, fallbackCampaignCategory, getCampaignCategoryId } from "@/lib/campaign-categories"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link, routing } from "@/routing"
import { buildLocaleAlternates, DEFAULT_OG_IMAGE, SITE_NAME, getLocalePath } from "@/lib/seo"
import { getTenantContext } from "@/lib/tenant-context"
import { Suspense } from "react"
import CampaignFilters from "@/components/campaign-filters"

function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") {
    return true
  }

  return error instanceof Error && error.message.includes("Can't reach database server")
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string } | Promise<{ locale: string }>
}): Promise<Metadata> {
  const p = await Promise.resolve(params)
  let locale = p?.locale
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  let title = "Campaigns"
  let description = "View all active offers and find the best deals"
  try {
    const t = await getTranslations({ locale, namespace: "campaigns" })
    title = t("title") || title
    description = t("description") || description
  } catch {
    // Fallback to defaults
  }

  const canonicalPath = getLocalePath(locale, "/campaigns")

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: buildLocaleAlternates("/campaigns"),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalPath,
      locale,
      siteName: SITE_NAME,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

type CampaignsSearchParams = {
  category?: string; q?: string; sort?: string;
  merchant?: string; minPrice?: string; maxPrice?: string;
}

export default async function CampaignsPage({
  params,
  searchParams,
}: {
  params: { locale: string } | Promise<{ locale: string }>
  // Accept both Promise (Next.js 15 contract) and plain object (called from
  // app/campaigns/page.tsx alias). `await Promise.resolve(x)` normalises both.
  searchParams?: CampaignsSearchParams | Promise<CampaignsSearchParams>
}) {
  const p = await Promise.resolve(params)
  const sp = await Promise.resolve(searchParams)
  let locale = p?.locale
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }
  setRequestLocale(locale)

  // Get tenant context for multi-tenancy isolation
  const context = await getTenantContext()

  const now = new Date()
  const searchQuery = sp?.q?.toString().trim() || ""
  const selectedCategory = sp?.category || "all"
  const sortBy = sp?.sort || "newest"
  const merchantFilter = sp?.merchant || ""
  const minPrice = sp?.minPrice ? parseInt(sp.minPrice, 10) * 100 : 0
  const maxPrice = sp?.maxPrice ? parseInt(sp.maxPrice, 10) * 100 : 0

  // Build where clause based on tenant context
  const campaignWhere = {
    status: "active",
    startDate: { lte: now },
    endDate: { gte: now },
    merchant: { isActive: true },
    ...(context.mode === "tenant" && context.tenant
      ? { merchantId: context.tenant.id }
      : {}),
  }

  async function fetchCampaigns() {
    return prisma.campaign.findMany({
      where: campaignWhere,
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            defaultCurrency: true,
            brandLogoUrl: true,
            brandColorsJson: true,
          },
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
      orderBy: { createdAt: "desc" },
      // Bound this public, unauthenticated query (merchant join + 2 _count
      // subqueries per row). Without a cap it scaled with every active
      // campaign on the platform.
      take: 60,
    })
  }

  let campaigns: Awaited<ReturnType<typeof fetchCampaigns>> = []
  let databaseUnavailable = false

  try {
    campaigns = await fetchCampaigns()
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      databaseUnavailable = true
    } else {
      throw error
    }
  }

  const categoryLabels: Record<string, string> = {
    cafe: "Cafe and bakery",
    beauty: "Beauty and wellness",
    fitness: "Fitness and sport",
    events: "Events and tickets",
    workshops: "Workshops",
    family: "Family and kids",
    travel: "Travel and stay",
    outdoor: "Outdoor and hikes",
    other: "Other",
  }

  const categoryOptions = [
    { id: "all", label: "All" },
    ...campaignCategories.map((cat) => ({ id: cat.id, label: categoryLabels[cat.id] || cat.id })),
    { id: fallbackCampaignCategory.id, label: categoryLabels[fallbackCampaignCategory.id] || "Other" },
  ]

  const filteredCampaigns = campaigns.filter((campaign) => {
    const categoryId = getCampaignCategoryId({
      name: campaign.name,
      description: campaign.description,
    })
    const matchesCategory = selectedCategory === "all" || categoryId === selectedCategory
    const matchesSearch =
      searchQuery.length === 0 ||
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.merchant.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMerchant = !merchantFilter || campaign.merchant.slug === merchantFilter
    const price = campaign.price || 0
    const matchesMinPrice = !minPrice || price >= minPrice
    const matchesMaxPrice = !maxPrice || price <= maxPrice
    return matchesCategory && matchesSearch && matchesMerchant && matchesMinPrice && matchesMaxPrice
  })

  // Sort
  const visibleCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "price_low": return (a.price || 0) - (b.price || 0)
      case "price_high": return (b.price || 0) - (a.price || 0)
      case "popular": return b._count.purchases - a._count.purchases
      case "expiring": return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const campaignCount = visibleCampaigns.length
  const merchantCount = new Set(visibleCampaigns.map((campaign) => campaign.merchantId)).size
  const voucherCount = visibleCampaigns.reduce((sum, campaign) => sum + campaign._count.vouchers, 0)

  // Unique merchants for filter dropdown
  const uniqueMerchants = Array.from(
    new Map(campaigns.map((c) => [c.merchant.slug, { slug: c.merchant.slug, name: c.merchant.name }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcfbf8] via-[#f4f1ea] to-[#f6e1d7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="relative overflow-hidden rounded-[32px] bg-[#2D2721] text-white py-12 px-6 sm:px-10 mb-10 shadow-warm-xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-6 left-10 w-48 h-48 bg-[#cc785c] rounded-full blur-3xl" />
            <div className="absolute bottom-6 right-10 w-56 h-56 bg-[#5e7e92] rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
              <Sparkles className="h-4 w-4 text-[#e0a487]" />
              <span className="text-sm font-medium text-white/90">Live campaign marketplace</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Discover the hottest offers in Europe</h1>
            <p className="text-[#FFF9ED]/80 mb-8 text-lg">
              Browse vouchers, gifts, and experiences curated from top merchants across your market.
            </p>
            <form className="max-w-2xl mx-auto bg-white rounded-2xl p-2 flex items-center shadow-xl">
              <Search className="h-5 w-5 text-[#8B7355] ml-4 flex-shrink-0" />
              <Input
                name="q"
                defaultValue={searchQuery}
                placeholder="Search campaigns, merchants, or services..."
                className="border-0 focus-visible:ring-0 text-[#2D2721] placeholder:text-[#8B7355]/60 h-11 text-base"
              />
            </form>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Ticket className="h-4 w-4 text-[#e0a487]" />
                <span className="font-semibold">{campaignCount}</span> campaigns
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Gift className="h-4 w-4 text-[#e0a487]" />
                <span className="font-semibold">{voucherCount}</span> vouchers
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <ShoppingBag className="h-4 w-4 text-[#e0a487]" />
                <span className="font-semibold">{merchantCount}</span> merchants
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {categoryOptions.map((category) => {
            const isActive = selectedCategory === category.id
            return (
              <Link
                key={category.id}
                href={`/campaigns?category=${category.id}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-[#cc785c] to-[#b5613f] text-white shadow-warm"
                    : "bg-white text-[#6B5744] hover:bg-[#f6e1d7] border border-[rgba(139,115,85,0.15)]"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {category.label}
              </Link>
            )
          })}
        </div>

        <div className="flex justify-center mb-10">
          <Suspense fallback={null}>
            <CampaignFilters merchants={uniqueMerchants} />
          </Suspense>
        </div>

        {visibleCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCampaigns.map((campaign) => {
              const discountRules = safeParseJson<{ type: string; value: number; currency?: string }>(
                campaign.discountRules
              )
              const brandColors = safeParseJson<Record<string, string>>(campaign.merchant.brandColorsJson)
              const accent = brandColors?.primary || "#E17B5C"
              const categoryId = getCampaignCategoryId({
                name: campaign.name,
                description: campaign.description,
              })
              const categoryLabel =
                categoryOptions.find((cat) => cat.id === categoryId)?.label || "Other"

              return (
                <WarmCard
                  key={campaign.id}
                  hover
                  padding="none"
                  className="overflow-hidden group cursor-pointer h-full flex flex-col bg-white/90 backdrop-blur"
                >
                  <div className="relative h-48 overflow-hidden bg-[#FAF7F2] flex items-center justify-center">
                    {campaign.merchant.brandLogoUrl ? (
                      <Image
                        src={campaign.merchant.brandLogoUrl}
                        alt={campaign.merchant.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 360px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${accent} 0%, #F5C98E 100%)` }}
                      >
                        <Ticket className="h-12 w-12 text-white/80" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#2D2721] shadow-sm">
                      {categoryLabel}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-3">
                      <p className="text-xs font-bold text-[#E17B5C] uppercase tracking-wider mb-1">
                        {campaign.merchant.name}
                      </p>
                      <h3 className="text-lg font-bold text-[#2D2721] line-clamp-2 group-hover:text-[#E17B5C] transition-colors">
                        {campaign.name}
                      </h3>
                    </div>

                    {discountRules && discountRules.type && discountRules.value !== undefined && (
                      <div className="mt-1 mb-4 flex items-center gap-2 text-sm text-[#6B5744]">
                        <Ticket className="h-4 w-4 text-[#E17B5C]" />
                        <span className="font-semibold text-[#2D2721]">
                          {discountRules.type === "percentage"
                            ? formatPercentage(discountRules.value)
                            : formatCurrency(
                                discountRules.value,
                                discountRules.currency || campaign.merchant.defaultCurrency
                              )}{" "}
                          discount
                        </span>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-[rgba(139,115,85,0.15)]/50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-[#2D2721]">
                            {campaign.price && campaign.price > 0
                              ? formatCurrency(campaign.price, campaign.merchant.defaultCurrency)
                              : "FREE"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#9DB5A5]">
                          {campaign._count.purchases} purchases
                        </span>
                      </div>

                      <WarmButton asChild size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                        <Link href={`/campaigns/${campaign.id}`}>
                          <ShoppingBag className="w-4 h-4" />
                        </Link>
                      </WarmButton>
                    </div>
                  </div>
                </WarmCard>
              )
            })}
          </div>
        ) : (
          <WarmCard padding="lg" className="text-center py-16 bg-white">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-[#8B7355]" />
            </div>
            <h3 className="text-xl font-bold text-[#2D2721] mb-2">
              {databaseUnavailable ? "Campaigns temporarily unavailable" : "No offers found"}
            </h3>
            <p className="text-[#6B5744] mb-6">
              {databaseUnavailable
                ? "Could not connect to the database. Please try again in a moment."
                : "Try a different search or choose another category."}
            </p>
            <WarmButton asChild variant="outline">
              <Link href="/campaigns">{databaseUnavailable ? "Try again" : "Clear filters"}</Link>
            </WarmButton>
          </WarmCard>
        )}
      </div>
    </div>
  )
}
