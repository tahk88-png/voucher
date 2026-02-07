"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, Share2, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/app", label: "Wallet", icon: Wallet },
  { href: "/app/share", label: "Share", icon: Share2 },
  { href: "/app/notifications", label: "Alerts", icon: Bell },
  { href: "/app/profile", label: "Profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E7DCC7] shadow-warm-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 h-full"
            >
              <span className="flex flex-col items-center justify-center gap-1 h-full">
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive
                    ? "bg-[#2D2721] text-white"
                    : "text-[#6B5744] hover:bg-[#FAF7F2]"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-xs font-bold transition-all",
                  isActive ? "text-[#2D2721]" : "text-[#8B7355]"
                )}>{item.label}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
