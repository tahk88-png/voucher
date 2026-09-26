// ISR: revalidate every 5 minutes — balances freshness with performance
export const revalidate = 300;

// Metadata (brand-only title, canonical, OG) comes from ./layout.tsx.

import HubShell from "@/components/layout/hub-shell"
import TenantShell from "@/components/layout/tenant-shell"
import SitePageRenderer from "@/components/site/site-page-renderer"
import MarketingLanding from "@/components/landing/marketing-landing"
import { prisma } from "@/lib/prisma"
import { isMerchantActive } from "@/lib/merchant-status"
import { getCampaignCategoryId, getCampaignCategoryLabel } from "@/lib/campaign-categories"
import { countryOptions } from "@/lib/locale-config"
import { formatCurrency, formatPercentage, safeParseJson } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { getSitePage } from "@/lib/site-pages"
import { getTenantContext } from "@/lib/tenant-context"

type LandingFeaturedOffer = {
  id: string
  name: string
  merchantName: string
  merchantLogoUrl: string | null
  categoryLabel: string
  marketLabel: string
  priceLabel: string
  purchases: number
  discountLabel: string | null
  onSale: boolean
}

type LandingStats = {
  merchantCount: number
  activeCampaignCount: number
  /** Total value of paid voucher purchases, in minor units. */
  processedCents: number
}

const marketCodeByName = new Map(countryOptions.map((country) => [country.name.toLowerCase(), country.code]))

function getMarketLabel(countryName: string, currency: string) {
  const normalizedCountry = countryName.trim().toLowerCase()
  const code = marketCodeByName.get(normalizedCountry) || countryName.slice(0, 2).toUpperCase()
  return `${code} / ${currency}`
}

/**
 * Real platform numbers for the landing stat row. These were previously
 * hardcoded marketing figures ("2,500+ merchants", "EUR 12M+ processed") that
 * did not correspond to anything in the database. The row renders only when
 * there is something real to show — see MarketingLanding.
 */
async function getPlatformStats(): Promise<LandingStats | null> {
  try {
    const now = new Date()
    const [merchantCount, activeCampaignCount, processed] = await Promise.all([
      prisma.merchant.count({ where: { isActive: true } }),
      prisma.campaign.count({
        // Same "active" definition as /campaigns.
        where: { status: "active", startDate: { lte: now }, endDate: { gte: now }, merchant: { isActive: true } },
      }),
      prisma.voucherPurchase.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      }),
    ])

    return {
      merchantCount,
      activeCampaignCount,
      processedCents: processed._sum.amount ?? 0,
    }
  } catch {
    // Landing must render even when the database is unreachable.
    logger.warn("landing: database unavailable, hiding platform stats")
    return null
  }
}

/**
 * Names of real active merchants for the "trusted by" row. Replaces a
 * hardcoded list of invented businesses.
 */
async function getTrustedMerchants(): Promise<string[]> {
  try {
    const merchants = await prisma.merchant.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { createdAt: "asc" },
      take: 12,
    })
    return merchants.map((m) => m.name)
  } catch {
    return []
  }
}

async function getLandingFeaturedOffers(): Promise<LandingFeaturedOffer[]> {
  try {
    const now = new Date()
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: "active",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            country: true,
            defaultCurrency: true,
            brandLogoUrl: true,
          },
        },
        _count: {
          select: {
            purchases: {
              where: {
                status: "paid",
              },
            },
            // A campaign can only be bought through a published, currently
            // valid voucher; without one it is listed but not on sale.
            vouchers: {
              where: {
                status: "published",
                validFrom: { lte: now },
                validTo: { gte: now },
              },
            },
          },
        },
      },
      orderBy: [{ promotedWeeklyEmail: "desc" }, { promotedNotification: "desc" }, { createdAt: "desc" }],
      take: 24,
    })

    const activeCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          const active = await isMerchantActive(campaign.merchantId)
          return active ? campaign : null
        } catch {
          return null
        }
      })
    )

    return activeCampaigns
      .filter((campaign): campaign is NonNullable<typeof campaign> => campaign !== null)
      .slice(0, 12)
      .map((campaign) => {
        const discountRules = safeParseJson<{ type?: string; value?: number; currency?: string }>(campaign.discountRules)
        let discountLabel: string | null = null
        const isFree = !campaign.price || campaign.price <= 0

        // "50% OFF" next to "FREE" reads as a contradiction; free offers show no discount badge.
        if (!isFree && discountRules && typeof discountRules.value === "number") {
          if (discountRules.type === "percentage") {
            discountLabel = `${formatPercentage(discountRules.value)} OFF`
          } else {
            discountLabel = `${formatCurrency(
              discountRules.value,
              discountRules.currency || campaign.merchant.defaultCurrency
            )} OFF`
          }
        }

        const categoryId = getCampaignCategoryId({
          name: campaign.name,
          description: campaign.description,
        })

        return {
          id: campaign.id,
          name: campaign.name,
          merchantName: campaign.merchant.name,
          merchantLogoUrl: campaign.merchant.brandLogoUrl,
          categoryLabel: getCampaignCategoryLabel(categoryId),
          marketLabel: getMarketLabel(campaign.merchant.country, campaign.merchant.defaultCurrency),
          priceLabel: isFree ? "FREE" : formatCurrency(campaign.price!, campaign.merchant.defaultCurrency),
          purchases: campaign._count.purchases,
          discountLabel,
          onSale: campaign._count.vouchers > 0,
        }
      })
  } catch {
    logger.warn("landing: database unavailable, rendering without featured offers")
    return []
  }
}

export default async function LandingPage() {
  const context = await getTenantContext()
  if (context.mode === "tenant" && context.tenant) {
    const page = await getSitePage({
      merchantId: context.tenant.id,
      scope: "tenant",
      slug: "/",
    })
    const blocks = Array.isArray(page?.blocksJson)
      ? (page?.blocksJson as string[])
      : ["hero", "featured_products", "featured_vouchers", "featured_rentals", "tenant_stats"]

    return (
      <TenantShell merchant={context.tenant}>
        <div className="py-10">
          <SitePageRenderer blocks={blocks} scope="tenant" merchant={context.tenant} />
        </div>
      </TenantShell>
    )
  }

  const [featuredOffers, platformStats, trustedMerchants] = await Promise.all([
    getLandingFeaturedOffers(),
    getPlatformStats(),
    getTrustedMerchants(),
  ])

  return (
    <HubShell>
      <MarketingLanding
        featuredOffers={featuredOffers}
        stats={platformStats}
        trustedMerchants={trustedMerchants}
      />
    </HubShell>
  )
}
