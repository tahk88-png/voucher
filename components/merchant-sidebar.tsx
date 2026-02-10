"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Ticket,
  CreditCard,
  Palette,
  Gift,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { WarmButton } from "@/components/warm-button"

const navItems = [
  { href: "/merchant", label: "Overview", icon: LayoutDashboard },
  { href: "/merchant/vouchers", label: "Vouchers", icon: Ticket },
  { href: "/merchant/gift-cards", label: "Gift cards", icon: Gift },
  { href: "/merchant/credits", label: "Credits", icon: CreditCard },
  { href: "/merchant/brand", label: "Brand", icon: Palette },
]

export function MerchantSidebar() {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] gradient-brand flex items-center justify-center shadow-warm">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--text)]">Merchant</div>
            <div className="text-xs text-[var(--text-faint)]">GiftHub console</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[14px] text-sm font-medium transition-all",
                isActive
                  ? "gradient-brand text-[var(--text)] shadow-warm"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-dim)] hover:text-[var(--text)]"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:border-r md:border-[var(--border)] md:bg-[var(--surface)]">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <WarmButton variant="ghost" size="sm" className="md:hidden h-10 w-10 p-0">
              <span className="flex items-center justify-center gap-2"><Menu className="h-5 w-5" /><span className="sr-only">Open menu</span></span>
            </WarmButton>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
