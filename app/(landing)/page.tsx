// ISR: revalidate every 5 minutes — balances freshness with performance
export const revalidate = 300;

// Metadata (brand-only title, canonical, OG) comes from ./layout.tsx.

import HubShell from "@/components/layout/hub-shell"
import TenantShell from "@/components/layout/tenant-shell"
import SitePageRenderer from "@/components/site/site-page-renderer"
import MarketingLanding from "@/components/landing/marketing-landing"
import { prisma } from "@/lib/prisma"
import { isMerchantActive } from "@/lib/merchant-status"
import { toCampaignCardData, type CampaignCardData } from "@/lib/campaign-presentation"
import { logger } from "@/lib/logger"
import { getSitePage } from "@/lib/site-pages"
import { getTenantContext } from "@/lib/tenant-context"

type LandingStats = {
  merchantCount: number
  activeCampaignCount: number
  /** Total value of paid voucher purchases, in minor units. */
  processedCents: number
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

async function getLandingFeaturedOffers(): Promise<CampaignCardData[]> {
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
            slug: true,
            city: true,
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
      .map(toCampaignCardData)
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
