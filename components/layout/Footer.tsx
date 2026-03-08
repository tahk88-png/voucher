import Link from "next/link"
import { Gift } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[var(--surface)]/50 backdrop-blur-sm border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-[var(--text)] hover:opacity-90 transition-opacity">
            <span className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Gift className="h-5 w-5 text-white" />
            </span>
            <span className="font-semibold">GiftHub</span>
          </Link>
          <p className="text-sm text-[var(--text-faint)]">© 2026 GiftHub. Made in Europe.</p>
        </div>
      </div>
    </footer>
  )
}
