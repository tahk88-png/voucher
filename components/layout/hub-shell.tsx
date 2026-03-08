import Link from "next/link"
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

  const header = headerLinks.length > 0 ? headerLinks : fallback.header

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-warm">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--text)]">GiftHub</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
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
                href="/campaigns"
                className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--surface)] text-[var(--text)] font-medium text-sm rounded-[12px] border-2 border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-warm transition-all"
              >
                <Gift className="h-4 w-4 text-[var(--primary)]" />
                <span>Kampaaniad</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-2.5 bg-[var(--danger)] hover:bg-[#D16B4C] text-white font-medium text-sm rounded-[16px] shadow-warm-sm hover:shadow-warm transition-all"
              >
                Logi sisse
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
