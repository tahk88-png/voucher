import Link from "next/link"
import { getNavigationLinks, getFallbackNavigation, localizeNavLinks, toPublicNavLinks } from "@/lib/navigation"
import { Gift } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { MobileNav } from "@/components/layout/mobile-nav"

interface HubShellProps {
  children: React.ReactNode
}

/**
 * Header shared by every public page (landing, campaigns, FAQ, contact, legal,
 * search, gifts, leaderboard, 404). The site footer is rendered once by the
 * root layout.
 */
export default async function HubShell({ children }: HubShellProps) {
  const fallback = getFallbackNavigation("hub")
  const headerLinks =
    (await getNavigationLinks({
      scope: "hub",
      position: "header",
    })) || []

  const t = await getTranslations("nav")
  const tSite = await getTranslations("site")
  const header = localizeNavLinks(toPublicNavLinks(headerLinks.length > 0 ? headerLinks : fallback.header), (key) =>
    tSite(`navLinks.${key}`),
  )
  const signInLabel = t("login")

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-warm">
                <Gift className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-[var(--text)]">GiftHub</span>
            </Link>

            <nav aria-label={tSite("header.mainNavLabel")} className="hidden md:flex items-center gap-1">
              {header.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="px-4 py-2 rounded-[12px] text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-dim)] hover:text-[var(--text)] transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden md:inline-flex items-center px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-medium text-sm rounded-[16px] shadow-warm-sm hover:shadow-warm transition-all"
              >
                {signInLabel}
              </Link>
              <MobileNav links={header} signInHref="/login" signInLabel={signInLabel} />
            </div>
          </div>
        </div>
      </header>
      {/* The root layout already provides the page's <main> landmark. */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
