import Link from "next/link"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { getNavigationLinks, getFallbackNavigation } from "@/lib/navigation"
import { Gift } from "lucide-react"

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
  const fallback = getFallbackNavigation("tenant")
  const headerLinks =
    (await getNavigationLinks({
      merchantId: merchant.id,
      scope: "tenant",
      position: "header",
    })) || []
  const footerLinks =
    (await getNavigationLinks({
      merchantId: merchant.id,
      scope: "tenant",
      position: "footer",
    })) || []

  const header = headerLinks.length > 0 ? headerLinks : fallback.header
  const footer = footerLinks.length > 0 ? footerLinks : fallback.footer

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5]">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[rgba(139,115,85,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            {merchant.brandLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={merchant.brandLogoUrl}
                alt={merchant.name}
                className="h-10 w-10 rounded-[12px] object-cover shadow-warm"
              />
            ) : (
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                <Gift className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-[#2D2721]">{merchant.name}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {header.map((link) => (
              <WarmButton key={link.id} asChild variant="ghost">
                <Link href={link.href}>{link.label}</Link>
              </WarmButton>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <WarmButton asChild variant="ghost">
              <Link href="/campaigns">Explore Campaigns</Link>
            </WarmButton>
            <WarmButton asChild>
              <Link href="/login">Login</Link>
            </WarmButton>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-white/50 backdrop-blur-sm border-t border-[rgba(139,115,85,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2D2721]">{merchant.name}</p>
            {merchant.supportEmail ? <p className="text-sm text-[#6B5744]">Support: {merchant.supportEmail}</p> : null}
            {merchant.website ? (
              <p className="text-sm text-[#6B5744]">
                <a href={merchant.website} className="underline underline-offset-2">
                  {merchant.website}
                </a>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 justify-start md:justify-end text-sm text-[#6B5744]">
            {footer.map((link) => (
              <Link key={link.id} href={link.href} className="hover:text-[#2D2721]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
