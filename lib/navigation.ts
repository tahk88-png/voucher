import { prisma } from "@/lib/prisma"

export type NavigationPosition = "header" | "footer"
export type NavigationScope = "tenant" | "hub"

export interface NavigationLinkItem {
  id: string
  label: string
  href: string
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
  } catch {
    console.warn("navigation: database unavailable, using fallback links")
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
