import Link from "next/link"
import { WarmButton } from "@/components/warm-button"
import { getNavigationLinks, getFallbackNavigation } from "@/lib/navigation"
import { Gift } from "lucide-react"

interface HubShellProps {
  children: React.ReactNode
}

export default async function HubShell({ children }: HubShellProps) {
  const fallback = getFallbackNavigation("hub")
  const headerLinks =
    (await getNavigationLinks({
      scope: "hub",
      position: "header",
    })) || []
  const footerLinks =
    (await getNavigationLinks({
      scope: "hub",
      position: "footer",
    })) || []

  const header = headerLinks.length > 0 ? headerLinks : fallback.header
  const footer = footerLinks.length > 0 ? footerLinks : fallback.footer

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E7DCC7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[#2D2721]">
                GiftHub
              </span>
            </Link>

            {/* Desktop Navigation - Figma style */}
            <nav className="hidden lg:flex items-center gap-1">
              {header.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="px-4 py-2 rounded-[12px] text-sm font-medium text-[#6B5744] hover:bg-[#F8F6F1] hover:text-[#2D2721] transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons - Figma style */}
            <div className="flex items-center gap-2">
              <Link
                href="/campaigns"
                className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-[#2D2721] font-medium text-sm rounded-[12px] border-2 border-[rgba(139,115,85,0.15)] hover:border-[rgba(139,115,85,0.3)] hover:shadow-warm transition-all"
              >
                <span>🎁</span>
                <span>Pakkumised</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-2.5 bg-[#E17B5C] hover:bg-[#D16B4C] text-white font-medium text-sm rounded-[16px] shadow-warm-sm hover:shadow-warm transition-all"
              >
                Logi sisse
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-white/50 backdrop-blur-sm border-t border-[rgba(139,115,85,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-[#2D2721]">GiftHub</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[#6B5744]">
              {footer.map((link) => (
                <Link key={link.id} href={link.href} className="hover:text-[#2D2721]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-sm text-[#8B7355] mt-6 text-center">© 2026 GiftHub. Made with ❤️ in Europe.</p>
        </div>
      </footer>
    </div>
  )
}
