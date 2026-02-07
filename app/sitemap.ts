import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { routing } from "@/routing"
import { getLocalePath, toAbsoluteUrl } from "@/lib/seo"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "active",
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  const staticPaths = ["/", "/campaigns"]
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
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
  }

  return entries
}
