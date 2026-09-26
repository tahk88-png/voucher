import Link from "next/link"
import { Gift } from "lucide-react"
import { PUBLIC_FOOTER_LINKS } from "@/lib/navigation"

export default function Footer() {
  return (
    <footer className="bg-[var(--surface)]/50 backdrop-blur-sm border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 text-[var(--text)] hover:opacity-90 transition-opacity">
            <span className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Gift className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="font-semibold">GiftHub</span>
          </Link>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {PUBLIC_FOOTER_LINKS.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-block py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-sm text-[var(--text-muted)]">© {new Date().getFullYear()} GiftHub. Made in Europe.</p>
        </div>
      </div>
    </footer>
  )
}
