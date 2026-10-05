import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { pageMetadata } from '@/lib/seo/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("directory.hub")
  return pageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: '/hub',
  })
}

import Link from "next/link"
import { ArrowRight, MapPin, Store, Tag } from "lucide-react"
import HubShell from "@/components/layout/hub-shell"
import SitePageRenderer from "@/components/site/site-page-renderer"
import { DemoBadge } from "@/components/campaign/campaign-card"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { getCampaignCategoryId } from "@/lib/campaign-categories"
import { getCategoryVisual, stripDemoMarker } from "@/lib/campaign-presentation"
import { isDemoMerchantSlug } from "@/lib/demo-content"
import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { getSitePage } from "@/lib/site-pages"

type DirectoryMerchant = {
  slug: string
  name: string
  city: string | null
  isDemo: boolean
  offerCount: number
  categoryId: string
}

async function getDirectory(): Promise<DirectoryMerchant[] | null> {
  try {
    const now = new Date()
    const merchants = await prisma.merchant.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        slug: true,
        name: true,
        city: true,
        campaigns: {
          // Same "live" definition as /campaigns.
          where: { status: "active", startDate: { lte: now }, endDate: { gte: now }, deletedAt: null },
          select: { name: true, description: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
      take: 120,
    })
    return merchants
      .map((merchant) => {
        const isDemo = isDemoMerchantSlug(merchant.slug)
        const first = merchant.campaigns[0]
        const categoryId = first ? getCampaignCategoryId(first) : "other"
        return {
          slug: merchant.slug,
          name: stripDemoMarker(merchant.name, isDemo),
          city: merchant.city,
          isDemo,
          offerCount: merchant.campaigns.length,
          categoryId,
        }
      })
      // Businesses with something to offer first; real ones before samples.
      .sort((a, b) => Number(b.offerCount > 0) - Number(a.offerCount > 0) || Number(a.isDemo) - Number(b.isDemo))
  } catch (error) {
    logger.warn("hub: database unavailable", { error: error instanceof Error ? error.message : String(error) })
    return null
  }
}

const CATEGORY_IDS = ["cafe", "beauty", "fitness", "events", "workshops", "family", "travel", "outdoor", "other"]

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}

export default async function HubPage() {
  // An admin-configured hub page (site page blocks) still takes precedence.
  const page = await getSitePage({ scope: "hub", slug: "/" })
  if (Array.isArray(page?.blocksJson)) {
    return (
      <HubShell>
        <div className="py-10">
          <SitePageRenderer blocks={page.blocksJson as string[]} scope="hub" />
        </div>
      </HubShell>
    )
  }

  const merchants = await getDirectory()
  const t = await getTranslations("directory.hub")
  const tLabels = await getTranslations("labels")
  const categoryLabel = (id: string) =>
    CATEGORY_IDS.includes(id) ? tLabels(`category.${id}`) : tLabels("category.other")

  return (
    <HubShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-[var(--text)] sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-[var(--text-muted)]">
            {t("subtitle")}
          </p>
        </header>

        {merchants === null ? (
          <WarmCard padding="lg" className="mx-auto max-w-xl bg-[var(--surface)] text-center" role="alert">
            <p className="font-semibold text-[var(--text)]">{t("loadError")}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{t("loadErrorHint")}</p>
            <WarmButton asChild variant="outline" size="sm" className="mt-4">
              <Link href="/hub">{t("retry")}</Link>
            </WarmButton>
          </WarmCard>
        ) : merchants.length === 0 ? (
          <WarmCard padding="lg" className="mx-auto max-w-xl bg-[var(--surface)] text-center">
            <Store className="mx-auto mb-3 h-8 w-8 text-[var(--text-faint)]" aria-hidden="true" />
            <p className="font-semibold text-[var(--text)]">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{t("emptyHint")}</p>
            <WarmButton asChild size="sm" className="mt-4">
              <Link href="/register">{t("joinCta")}</Link>
            </WarmButton>
          </WarmCard>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((merchant) => {
              const visual = getCategoryVisual(merchant.categoryId)
              return (
                <li key={merchant.slug}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-warm-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-warm focus-within:ring-2 focus-within:ring-[var(--ring)]">
                    <div className="relative h-24" style={{ background: visual.gradient }} aria-hidden="true">
                      <visual.icon className="absolute -bottom-8 right-3 h-32 w-32 rotate-[-12deg] text-white/15 stroke-[1.25]" />
                    </div>
                    <div className="relative flex flex-1 flex-col px-5 pb-5">
                      <div className="-mt-8 mb-3 grid h-16 w-16 place-items-center rounded-2xl border-4 border-[var(--surface)] bg-[var(--primary)] text-xl font-bold text-[var(--primary-foreground)] shadow-warm">
                        {initials(merchant.name)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[var(--text)] group-hover:text-[var(--primary)]">
                          <Link
                            href={`/m/${merchant.slug}`}
                            className="focus:outline-none after:absolute after:inset-0 after:content-['']"
                          >
                            {merchant.name}
                          </Link>
                        </h2>
                        {merchant.isDemo && <DemoBadge />}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-muted)]">
                        {merchant.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            {merchant.city}
                          </span>
                        )}
                        {merchant.offerCount > 0 && <span>{categoryLabel(merchant.categoryId)}</span>}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
                          <Tag className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                          {merchant.offerCount === 0
                            ? t("noOffers")
                            : t("offerCount", { count: merchant.offerCount })}
                        </span>
                        <ArrowRight
                          className="h-4 w-4 text-[var(--primary)] transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </HubShell>
  )
}
