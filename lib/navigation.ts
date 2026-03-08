import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type NavigationPosition = "header" | "footer"
export type NavigationScope = "tenant" | "hub"

export interface NavigationLinkItem {
  id: string
  label: string
  href: string
}

const DB_RETRY_COOLDOWN_MS = 30_000
let dbUnavailableUntil = 0
let lastDbUnavailableLogAt = 0

function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") return true
  return error instanceof Error && error.message.includes("Can't reach database server")
}

export async function getNavigationLinks({
  merchantId,
  scope,
  position,
}: {
  merchantId?: string | null
  scope: NavigationScope
  position: NavigationPosition
}): Promise<NavigationLinkItem[]> {
  if (Date.now() < dbUnavailableUntil) {
    return getFallbackNavigation(scope)[position]
  }

  try {
    const links = await prisma.navigationLink.findMany({
      where: {
        scope,
        position,
        merchantId: merchantId ?? null,
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })

    // Deduplicate by href (DB may contain duplicates)
    const seen = new Set<string>()
    return links
      .map((link) => ({ id: link.id, label: link.label, href: link.href }))
      .filter((link) => {
        if (seen.has(link.href)) return false
        seen.add(link.href)
        return true
      })
  } catch (error) {
    const now = Date.now()
    if (isDatabaseUnavailableError(error)) {
      dbUnavailableUntil = now + DB_RETRY_COOLDOWN_MS
      if (now - lastDbUnavailableLogAt > DB_RETRY_COOLDOWN_MS) {
        lastDbUnavailableLogAt = now
        console.warn("navigation: database unavailable, using fallback links")
      }
    } else {
      console.warn("navigation: failed to load links, using fallback links")
    }
    return getFallbackNavigation(scope)[position]
  }
}

export function getFallbackNavigation(scope: NavigationScope): {
  header: NavigationLinkItem[]
  footer: NavigationLinkItem[]
} {
  if (scope === "hub") {
    return {
      header: [
        { id: "hub-home", label: "Hub", href: "/hub" },
        { id: "hub-campaigns", label: "Campaigns", href: "/campaigns" },
      ],
      footer: [
        { id: "hub-privacy", label: "Privacy", href: "/privacy" },
        { id: "hub-terms", label: "Terms", href: "/terms" },
      ],
    }
  }

  return {
    header: [
      { id: "tenant-home", label: "Home", href: "/" },
      { id: "tenant-campaigns", label: "Campaigns", href: "/campaigns" },
    ],
    footer: [
      { id: "tenant-about", label: "About", href: "/p/about" },
      { id: "tenant-contact", label: "Contact", href: "/p/contact" },
    ],
  }
}
