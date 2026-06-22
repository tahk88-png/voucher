"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useNotificationsSSE } from "@/hooks/use-notifications-sse"
import {
  Award,
  Users,
  Wallet,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  Gift,
  Ticket,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Coins,
  Crown,
  Trophy,
  Heart,
  MapPin,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WarmButton } from "@/components/warm-button"
import { CountrySelector } from "@/components/navigation/country-selector"
import { LanguageSelector } from "@/components/navigation/language-selector"
import { useCountry } from "@/components/contexts/country-context"
import { RoleSwitcher, type RoleSwitcherMerchant, type RoleSwitcherOrg } from "@/components/navigation/role-switcher"

interface UserShellProps {
  userLabel: string
  stats: Array<{ label: string; value: string }>
  roles?: string[]
  merchantMemberships?: RoleSwitcherMerchant[]
  orgMemberships?: RoleSwitcherOrg[]
  adminRole?: string | null
  children: React.ReactNode
}

const navItems = [
  { labelKey: "dashboard", fallback: "My Rewards", icon: Award, href: "/app", bottomNav: true },
  { labelKey: "myVouchers", fallback: "My Vouchers", icon: Ticket, href: "/app/vouchers", bottomNav: true },
  { labelKey: "deals", fallback: "Deals", icon: Tag, href: "/deals", bottomNav: false },
  { labelKey: "nearby", fallback: "Nearby", icon: MapPin, href: "/app/nearby", bottomNav: false },
  { labelKey: "wishlist", fallback: "Wishlist", icon: Heart, href: "/app/wishlist", bottomNav: false },
  { labelKey: "b2b", fallback: "B2B Orgs", icon: Users, href: "/app/b2b", bottomNav: false },
  { labelKey: "referrals", fallback: "Referrals", icon: Users, href: "/app/referrals", bottomNav: true },
  { labelKey: "wallet", fallback: "Wallet", icon: Wallet, href: "/app/wallet", bottomNav: true },
  { labelKey: "cashback", fallback: "Cashback", icon: Coins, href: "/app/cashback", bottomNav: false },
  { labelKey: "loyalty", fallback: "Loyalty", icon: Crown, href: "/app/loyalty", bottomNav: false },
  { labelKey: "achievements", fallback: "Achievements", icon: Trophy, href: "/app/achievements", bottomNav: false },
  { labelKey: "leaderboard", fallback: "Leaderboard", icon: TrendingUp, href: "/leaderboard", bottomNav: false },
  { labelKey: "notifications", fallback: "Notifications", icon: Bell, href: "/app/notifications", bottomNav: false },
  { labelKey: "settings", fallback: "Settings", icon: Settings, href: "/app/settings", bottomNav: true },
]

const bottomNavItems = navItems.filter((item) => item.bottomNav)

export default function UserShell({ userLabel, stats, roles = [], merchantMemberships = [], orgMemberships = [], adminRole, children }: UserShellProps) {
  const pathname = usePathname()
  const tNav = useTranslations("nav")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { selectedCountry } = useCountry()
  const { unreadCount } = useNotificationsSSE(true)
  const showRoleSwitcher =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true"

  useEffect(() => {
    const contentCreationPaths = ["/create", "/edit", "/analytics"]
    if (contentCreationPaths.some((path) => pathname.includes(path))) {
      setCollapsed(true)
    }
  }, [pathname])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const getNavLabel = (labelKey: string, fallback: string) => {
    const translated = tNav(labelKey as never)
    return translated === labelKey ? fallback : translated
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--surface)] border-b border-[var(--border)] shadow-warm-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-[12px] gradient-brand flex items-center justify-center shadow-warm">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text)]">GiftHub</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-[12px] flex items-center justify-center hover:bg-[var(--surface-dim)] transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="user-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-[var(--text)]" /> : <Menu className="h-6 w-6 text-[var(--text)]" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)} />
            <div
              id="user-mobile-menu"
              className="fixed top-16 left-0 right-0 bottom-0 bg-[var(--surface)] z-50 overflow-y-auto"
            >
              <div className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isNotifications = item.href === "/app/notifications"
                  const showBadge = isNotifications && unreadCount > 0
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all",
                        isActive(item.href)
                          ? "gradient-brand text-[var(--text)] shadow-warm"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-dim)]"
                      )}
                    >
                      <span className="relative flex-shrink-0">
                        <Icon className="h-5 w-5" />
                        {showBadge && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </span>
                      {getNavLabel(item.labelKey, item.fallback)}
                    </Link>
                  )
                })}
                <Link
                  href="/api/auth/signout?callbackUrl=/"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium text-[var(--danger)] hover:bg-[#FEE2E2] transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  {tNav("logout")}
                </Link>
              </div>
            </div>
          </>
        )}
      </header>

      <div className="lg:hidden h-16" />

      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-[var(--surface)] border-r border-[var(--border)] shadow-warm-sm transition-all duration-300",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="relative flex items-center gap-3 px-6 py-6 border-b border-[var(--border)]">
            <div className="w-12 h-12 rounded-[14px] gradient-brand flex items-center justify-center shadow-warm flex-shrink-0">
              <Gift className="h-7 w-7 text-white" />
            </div>
            <span
              className={cn(
                "text-2xl font-bold text-[var(--text)] transition-opacity duration-300",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              GiftHub
            </span>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-9 bg-[var(--surface)] border border-[var(--border)] rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--danger)] shadow-sm hover:shadow-md transition-transform"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon
              const isNotifications = item.href === "/app/notifications"
              const showBadge = isNotifications && unreadCount > 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? getNavLabel(item.labelKey, item.fallback) : ""}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-[14px] font-medium transition-all relative group",
                    isActive(item.href)
                      ? "gradient-brand text-[var(--text)] shadow-warm"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-dim)]",
                    collapsed && "justify-center"
                  )}
                >
                  <span className="relative flex-shrink-0">
                    <Icon className="h-5 w-5" />
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "transition-all duration-300 whitespace-nowrap",
                      collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                    )}
                  >
                    {getNavLabel(item.labelKey, item.fallback)}
                  </span>
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--text)] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {getNavLabel(item.labelKey, item.fallback)}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-[var(--border)]">
            {!collapsed && roles.length > 0 && (
              <div className="mb-4">
                <RoleSwitcher
                  roles={roles}
                  merchantMemberships={merchantMemberships}
                  orgMemberships={orgMemberships}
                  adminRole={adminRole}
                />
              </div>
            )}

            <div
              className={cn(
                "bg-gradient-to-br from-[var(--bg-2)] to-[#FFE5B4] rounded-[14px] p-4 mb-3 transition-all",
                collapsed && "bg-none p-0 mb-4 bg-transparent"
              )}
            >
              <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "mb-3")}>
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center font-semibold text-[var(--text)] flex-shrink-0">
                  {userLabel.slice(0, 2).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[var(--text)] text-sm truncate">{userLabel}</div>
                    <div className="text-xs text-[var(--text-faint)] truncate">{tNav("user")}</div>
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
                {!collapsed && tNav("logout")}
              </Link>
            </WarmButton>
          </div>
        </div>
      </aside>

      <main className={cn("transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <div className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
          <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedCountry.flag}</span>
              <div>
                <div className="font-semibold text-[var(--text)] text-sm">{selectedCountry.name}</div>
                <div className="text-xs text-[var(--text-faint)]">Marketplace Context</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">Language</span>
                <LanguageSelector variant="compact" />
              </div>
              <div className="hidden md:flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">Marketplace</span>
                <CountrySelector variant="compact" />
              </div>
              <div className="md:hidden flex items-center gap-2">
                <LanguageSelector variant="compact" />
                <CountrySelector variant="compact" />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-r from-[var(--bg-2)] to-[#FFE5B4]/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat, index) => {
                const Icon =
                  index === 0 ? Users : index === 1 ? TrendingUp : index === 2 ? Gift : Sparkles
                return (
                  <div key={stat.label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-faint)]">{stat.label}</div>
                      <div className="font-semibold text-[var(--text)]">{stat.value}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">{children}</div>
      </main>

      <nav role="navigation" aria-label="Main navigation" className="lg:hidden fixed bottom-0 inset-x-0 bg-[var(--surface)] border-t border-[var(--border)] shadow-warm-lg z-40">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-[12px] transition-all",
                  isActive(item.href)
                    ? "gradient-brand text-[var(--text)]"
                    : "text-[var(--text-faint)] hover:bg-[var(--surface-dim)]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{getNavLabel(item.labelKey, item.fallback)}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="lg:hidden h-20" />
    </div>
  )
}
