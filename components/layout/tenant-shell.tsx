import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { WarmButton } from "@/components/warm-button"
import { getNavigationLinks, getFallbackNavigation } from "@/lib/navigation"
import { Gift } from "lucide-react"
import { MobileNav } from "@/components/layout/mobile-nav"

interface TenantShellProps {
  merchant: {
    id: string
    name: string
    slug: string
    brandLogoUrl: string | null
    supportEmail: string | null
    website: string | null
  }
  children: React.ReactNode
}

export default async function TenantShell({ merchant, children }: TenantShellProps) {
  const t = await getTranslations("directory.tenantShell")
  const fallback = getFallbackNavigation("tenant")
  const headerLinks =
    (await getNavigationLinks({
      merchantId: merchant.id,
      scope: "tenant",
      position: "header",
    })) || []

  const configured = headerLinks.length > 0 ? headerLinks : fallback.header
  // Campaigns must stay reachable now that the separate header button is gone.
  const header = configured.some((link) => link.href === "/campaigns")
    ? configured
    : [...configured, { id: "tenant-campaigns", label: t("campaigns"), href: "/campaigns" }]

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--surface)]/80 border-b border-[var(--border)]">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            {merchant.brandLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={merchant.brandLogoUrl}
                alt={merchant.name}
                className="h-10 w-10 rounded-[12px] object-cover shadow-warm"
              />
            ) : (
              <div className="w-10 h-10 rounded-[12px] gradient-brand flex items-center justify-center shadow-warm">
                <Gift className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-[var(--text)]">{merchant.name}</span>
          </Link>
          <nav aria-label={t("mainNav")} className="hidden md:flex items-center gap-2">
            {header.map((link) => (
              <WarmButton key={link.id} asChild variant="ghost">
                <Link href={link.href}>{link.label}</Link>
              </WarmButton>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <WarmButton asChild className="hidden md:inline-flex">
              <Link href="/login">{t("signIn")}</Link>
            </WarmButton>
            <MobileNav links={header} signInHref="/login" signInLabel={t("signIn")} />
          </div>
        </div>
      </header>
      {/* The root layout already provides the page's <main> landmark. */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
