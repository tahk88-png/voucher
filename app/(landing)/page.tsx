// ISR: revalidate every 5 minutes — balances freshness with performance
export const revalidate = 300;

import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Home', path: '/' });

import HubShell from "@/components/layout/hub-shell"
import TenantShell from "@/components/layout/tenant-shell"
import SitePageRenderer from "@/components/site/site-page-renderer"
import MarketingLanding from "@/components/landing/marketing-landing"
import { prisma } from "@/lib/prisma"
import { isMerchantActive } from "@/lib/merchant-status"
import { getCampaignCategoryId } from "@/lib/campaign-categories"
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
}

const categoryLabels: Record<string, string> = {
  cafe: "Cafe & Bakery",
  beauty: "Beauty",
  fitness: "Fitness",
  events: "Events",
  workshops: "Workshops",
  family: "Family",
  travel: "Travel",
  outdoor: "Outdoor",
  other: "Other",
}

const marketCodeByName = new Map(countryOptions.map((country) => [country.name.toLowerCase(), country.code]))

function getMarketLabel(countryName: string, currency: string) {
  const normalizedCountry = countryName.trim().toLowerCase()
  const code = marketCodeByName.get(normalizedCountry) || countryName.slice(0, 2).toUpperCase()
  return `${code} / ${currency}`
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

        if (discountRules && typeof discountRules.value === "number") {
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
          categoryLabel: categoryLabels[categoryId] || "Other",
          marketLabel: getMarketLabel(campaign.merchant.country, campaign.merchant.defaultCurrency),
          priceLabel:
            campaign.price && campaign.price > 0
              ? formatCurrency(campaign.price, campaign.merchant.defaultCurrency)
              : "FREE",
          purchases: campaign._count.purchases,
          discountLabel,
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

  const featuredOffers = await getLandingFeaturedOffers()

  return (
    <HubShell>
      <MarketingLanding featuredOffers={featuredOffers} />
    </HubShell>
  )
}
