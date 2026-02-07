"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Gift,
  CreditCard,
  Megaphone,
  Calendar,
  CheckCircle,
  Settings,
  LayoutTemplate,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Users,
} from "lucide-react"
import { WarmButton } from "@/components/warm-button"
import { cn } from "@/lib/utils"
import { CountrySelector } from "@/components/navigation/country-selector"
import { LanguageSelector } from "@/components/navigation/language-selector"
import { useCountry } from "@/components/contexts/country-context"

interface MerchantShellProps {
  slug: string
  merchantName: string
  userLabel: string
  stats: Array<{ label: string; value: string }>
  children: React.ReactNode
}

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, href: (slug: string) => `/merchant/${slug}/dashboard` },
  { key: "vouchers", icon: Gift, href: (slug: string) => `/merchant/${slug}/vouchers` },
  { key: "giftCards", icon: CreditCard, href: (slug: string) => `/merchant/${slug}/gift-cards` },
  { key: "campaigns", icon: Megaphone, href: (slug: string) => `/merchant/${slug}/campaigns` },
  { key: "events", icon: Calendar, href: (slug: string) => `/merchant/${slug}/events` },
  { key: "redemptions", icon: CheckCircle, href: (slug: string) => `/merchant/${slug}/redemptions` },
  { key: "pageBuilder", icon: LayoutTemplate, href: (slug: string) => `/merchant/${slug}/page-builder` },
  { key: "settings", icon: Settings, href: (slug: string) => `/merchant/${slug}/settings` },
]

export default function MerchantShell({
  slug,
  merchantName,
  userLabel,
  stats,
  children,
}: MerchantShellProps) {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { selectedCountry } = useCountry()

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[rgba(139,115,85,0.1)] shadow-warm-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href={`/merchant/${slug}/dashboard`} className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm" />
            <span className="text-xl font-bold text-[#2D2721]">{merchantName}</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-[12px] flex items-center justify-center hover:bg-[#F8F6F1] transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="merchant-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-[#2D2721]" /> : <Menu className="h-6 w-6 text-[#2D2721]" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)} />
            <div
              id="merchant-mobile-menu"
              className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto"
            >
              <div className="p-4 space-y-2">
                {navItems.map((item) => {
                  const href = item.href(slug)
                  const Icon = item.icon
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all",
                        isActive(href)
                          ? "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm"
                          : "text-[#6B5744] hover:bg-[#F8F6F1]"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {t(item.key)}
                    </Link>
                  )
                })}
                <Link
                  href="/api/auth/signout?callbackUrl=/"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium text-[#E17B5C] hover:bg-[#FEE2E2] transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  {t("logout")}
                </Link>
              </div>
            </div>
          </>
        )}
      </header>

      <div className="lg:hidden h-16" />

      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white border-r border-[rgba(139,115,85,0.1)] shadow-warm-sm transition-all duration-300",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="relative flex items-center gap-3 px-6 py-6 border-b border-[rgba(139,115,85,0.1)]">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm flex-shrink-0" />
            <span
              className={cn(
                "text-2xl font-bold text-[#2D2721] transition-opacity duration-300",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              {merchantName}
            </span>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-9 bg-white border border-[#E7DCC7] rounded-full p-1 text-[#6B5744] hover:text-[#E17B5C] shadow-sm hover:shadow-md transition-transform"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const href = item.href(slug)
              const Icon = item.icon
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? t(item.key) : ""}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-[14px] font-medium transition-all relative group",
                    isActive(href)
                      ? "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm"
                      : "text-[#6B5744] hover:bg-[#F8F6F1]",
                    collapsed && "justify-center"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={cn(
                      "transition-all duration-300 whitespace-nowrap",
                      collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                    )}
                  >
                    {t(item.key)}
                  </span>
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#2D2721] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {t(item.key)}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-[rgba(139,115,85,0.1)]">
            <div
              className={cn(
                "bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px] p-4 mb-3 transition-all",
                collapsed && "bg-none p-0 mb-4 bg-transparent"
              )}
            >
              <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "mb-1")}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center font-semibold text-[#2D2721] flex-shrink-0">
                  {merchantName.slice(0, 2).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#2D2721] text-sm truncate">{merchantName}</div>
                    <div className="text-xs text-[#8B7355] truncate">{userLabel}</div>
                  </div>
                )}
              </div>
            </div>
            <WarmButton
              variant="outline"
              size="sm"
              fullWidth
              asChild
              className={collapsed ? "px-0 justify-center" : ""}
            >
              <Link href="/api/auth/signout?callbackUrl=/">
                <LogOut className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
                {!collapsed && t("logout")}
              </Link>
            </WarmButton>
          </div>
        </div>
      </aside>

      <main className={cn("transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <div className="sticky top-0 z-30 bg-white border-b border-[rgba(139,115,85,0.1)] shadow-sm">
          <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedCountry.flag}</span>
              <div>
                <div className="font-semibold text-[#2D2721] text-sm">{selectedCountry.name}</div>
                <div className="text-xs text-[#8B7355]">Market Data</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector variant="compact" />
              <CountrySelector variant="compact" />
            </div>
          </div>

          <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-r from-[#FFF9ED] to-[#FFE5B4]/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat) => {
                const Icon =
                  stat.label === "Active Users"
                    ? Users
                    : stat.label === "Campaigns"
                    ? TrendingUp
                    : stat.label === "Vouchers"
                    ? Gift
                    : Sparkles
                return (
                  <div key={stat.label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-[#8B7355]">{stat.label}</div>
                      <div className="font-semibold text-[#2D2721]">{stat.value}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">{children}</div>
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[rgba(139,115,85,0.1)] shadow-warm-lg z-40">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const href = item.href(slug)
            const Icon = item.icon
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-[12px] transition-all",
                  isActive(href)
                    ? "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721]"
                    : "text-[#8B7355] hover:bg-[#F8F6F1]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{t(item.key)}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="lg:hidden h-20" />
    </div>
  )
}
