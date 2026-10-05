import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { routing } from "@/routing"
import { getLocalePath, toAbsoluteUrl } from "@/lib/seo"
import { logger } from "@/lib/logger"
import { notDemoMerchant } from "@/lib/demo-content"

// Rendered per request, not prerendered/ISR: `next build` has neither the
// runtime NEXT_PUBLIC_APP_URL nor a database, so a build-time sitemap lists
// http://localhost:3000 URLs without any campaigns, merchants or vouchers.
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticPaths = ["/", "/campaigns"]
  const entries: MetadataRoute.Sitemap = []

  let campaigns: Array<{ id: string; updatedAt: Date }> = []
  let merchants: Array<{ slug: string; updatedAt: Date }> = []
  let vouchers: Array<{ id: string; updatedAt: Date }> = []

  try {
    ;[campaigns, merchants, vouchers] = await Promise.all([
      prisma.campaign.findMany({
        where: {
          status: "active",
          startDate: { lte: now },
          endDate: { gte: now },
          // Demo content is for visitors, not search engines.
          merchant: notDemoMerchant,
        },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.merchant.findMany({
        where: { isActive: true, ...notDemoMerchant },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.voucher.findMany({
        where: {
          status: "published",
          validTo: { gte: now },
          merchant: notDemoMerchant,
        },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
    ])
  } catch (err) {
    // Database unavailable at build/revalidation time — serve static-only sitemap.
    // Logged so a persistently empty DB-backed sitemap is detectable in monitoring.
    logger.warn("sitemap: database unavailable, serving static-only", {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // Only URLs that actually exist. Under /[locale] there are just the campaign
  // list and campaign pages: `/<locale>` itself redirects to `/`, and the
  // merchant (/m) and voucher (/v) pages exist only without a locale prefix.
  // The sitemap used to prefix everything with every locale, so for each of
  // the non-default locales it listed a redirect plus a 404 for every merchant
  // and voucher.
  for (const locale of routing.locales) {
    const isDefaultLocale = locale === routing.defaultLocale

    for (const path of staticPaths) {
      if (path === "/" && !isDefaultLocale) continue
      entries.push({
        url: toAbsoluteUrl(getLocalePath(locale, path)),
        lastModified: now,
        changeFrequency: path === "/" ? "weekly" : "daily",
        priority: path === "/" ? 1 : 0.8,
      })
    }

    for (const campaign of campaigns) {
      entries.push({
        url: toAbsoluteUrl(getLocalePath(locale, `/campaigns/${campaign.id}`)),
        lastModified: campaign.updatedAt,
        changeFrequency: "daily",
        priority: 0.7,
      })
    }

    if (!isDefaultLocale) continue

    for (const merchant of merchants) {
      entries.push({
        url: toAbsoluteUrl(`/m/${merchant.slug}`),
        lastModified: merchant.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }

    for (const voucher of vouchers) {
      entries.push({
        // Public voucher route is /v/[id] (there is no /vouchers/[id] page) —
        // the old path 404'd for every voucher × locale in the sitemap.
        url: toAbsoluteUrl(`/v/${voucher.id}`),
        lastModified: voucher.updatedAt,
        changeFrequency: "daily",
        priority: 0.5,
      })
    }
  }

  return entries
}
