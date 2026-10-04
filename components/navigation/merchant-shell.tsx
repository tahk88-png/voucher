"use client"

import { useState } from "react"
import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"
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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Users,
  UserCheck,
  Building2,
  ScanLine,
  BarChart3,
  Star,
  ScrollText,
  Key,
  Mail,
  CalendarCheck,
  Package,
  Webhook,
  DollarSign,
  Boxes,
  ArrowUpRight,
} from "lucide-react"
import { WarmButton } from "@/components/warm-button"
import { cn } from "@/lib/utils"
import { LanguageSelector } from "@/components/navigation/language-selector"
import type { TenantMembershipRole } from "@/lib/access-control"

interface MerchantShellProps {
  slug: string
  merchantName: string
  userLabel: string
  tenantRole: TenantMembershipRole
  stats: MerchantShellStat[]
  children: React.ReactNode
}

type NavItem = {
  labelKey: string
  fallback: string
  icon: typeof LayoutDashboard
  href: (slug: string) => string
  minRole: TenantMembershipRole
  /** Links that leave the merchant area get a visible hint. */
  external?: boolean
  /** Extra paths that should also highlight this item. */
  alsoActive?: (slug: string) => string[]
}

type NavGroup = { title: string; items: NavItem[] }

const staff = "merchant_staff" as TenantMembershipRole
const admin = "merchant_admin" as TenantMembershipRole

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { labelKey: "dashboard", fallback: "Dashboard", icon: LayoutDashboard, href: (slug) => `/merchant/${slug}`, minRole: staff, alsoActive: (slug) => [`/merchant/${slug}/dashboard`] },
      { labelKey: "analytics", fallback: "Analytics", icon: TrendingUp, href: (slug) => `/merchant/${slug}/analytics`, minRole: staff },
      { labelKey: "reports", fallback: "Reports", icon: BarChart3, href: (slug) => `/merchant/${slug}/reports`, minRole: admin },
    ],
  },
  {
    title: "Offers",
    items: [
      { labelKey: "vouchers", fallback: "Vouchers", icon: Gift, href: (slug) => `/merchant/${slug}/vouchers`, minRole: staff },
      { labelKey: "campaigns", fallback: "Campaigns", icon: Megaphone, href: (slug) => `/merchant/${slug}/campaigns`, minRole: staff },
      { labelKey: "giftCards", fallback: "Gift Cards", icon: CreditCard, href: (slug) => `/merchant/${slug}/gift-cards`, minRole: staff },
      { labelKey: "events", fallback: "Events", icon: Calendar, href: (slug) => `/merchant/${slug}/events`, minRole: staff },
      { labelKey: "subscriptionBoxes", fallback: "Subscription Boxes", icon: Boxes, href: (slug) => `/merchant/${slug}/subscription-boxes`, minRole: admin },
      { labelKey: "pricing", fallback: "Pricing Rules", icon: DollarSign, href: (slug) => `/merchant/${slug}/pricing`, minRole: admin },
    ],
  },
  {
    title: "In store",
    items: [
      { labelKey: "scanner", fallback: "Scanner", icon: ScanLine, href: (slug) => `/merchant/${slug}/scanner`, minRole: staff },
      { labelKey: "redemptions", fallback: "Redemptions", icon: CheckCircle, href: (slug) => `/merchant/${slug}/redemptions`, minRole: staff },
      { labelKey: "appointments", fallback: "Appointments", icon: CalendarCheck, href: (slug) => `/merchant/${slug}/appointments`, minRole: staff },
      { labelKey: "rentals", fallback: "Rentals", icon: Package, href: (slug) => `/merchant/${slug}/rentals`, minRole: staff },
    ],
  },
  {
    title: "Customers",
    items: [
      { labelKey: "customers", fallback: "Customers", icon: UserCheck, href: (slug) => `/merchant/${slug}/customers`, minRole: admin },
      { labelKey: "reviews", fallback: "Reviews", icon: Star, href: (slug) => `/merchant/${slug}/reviews`, minRole: staff },
      { labelKey: "emailCampaigns", fallback: "Email Campaigns", icon: Mail, href: (slug) => `/merchant/${slug}/email-campaigns`, minRole: admin },
      { labelKey: "b2b", fallback: "B2B Orgs", icon: Building2, href: () => `/app/b2b`, minRole: staff, external: true },
    ],
  },
  {
    title: "Settings",
    items: [
      { labelKey: "settings", fallback: "Settings & Billing", icon: Settings, href: (slug) => `/merchant/${slug}/settings`, minRole: admin },
      { labelKey: "team", fallback: "Team", icon: Users, href: (slug) => `/merchant/${slug}/members`, minRole: admin },
      { labelKey: "pageBuilder", fallback: "Page Builder", icon: LayoutTemplate, href: (slug) => `/merchant/${slug}/page-builder`, minRole: admin },
      { labelKey: "apiKeys", fallback: "API Keys", icon: Key, href: (slug) => `/merchant/${slug}/settings/api-keys`, minRole: admin },
      { labelKey: "webhooks", fallback: "Webhooks", icon: Webhook, href: (slug) => `/merchant/${slug}/settings/webhooks`, minRole: admin },
      { labelKey: "auditLog", fallback: "Audit Log", icon: ScrollText, href: (slug) => `/merchant/${slug}/audit-log`, minRole: admin },
    ],
  },
]

/** The tabs a phone user needs most, in order. */
const bottomNavKeys = ["dashboard", "scanner", "redemptions", "vouchers"]

const statIcons = {
  campaigns: Megaphone,
  vouchers: Gift,
  redemptions: CheckCircle,
} as const

export type MerchantShellStat = { label: string; value: string; icon?: keyof typeof statIcons }

export default function MerchantShell({
  slug,
  merchantName,
  userLabel,
  tenantRole,
  stats,
  children,
}: MerchantShellProps) {
  const pathname = usePathname() ?? ""
  const tNav = useTranslations("nav")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const roleRank: Record<TenantMembershipRole, number> = {
    merchant_staff: 1,
    merchant_admin: 2,
  }

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => roleRank[tenantRole] >= roleRank[item.minRole]),
    }))
    .filter((group) => group.items.length > 0)
  const visibleNavItems = visibleGroups.flatMap((group) => group.items)

  // Highlight only the most specific matching item: the dashboard lives at
  // /merchant/<slug>, which is a prefix of every page, and /settings is a
  // prefix of /settings/api-keys and /settings/webhooks.
  const activeHref = (() => {
    let best: string | null = null
    let bestLength = -1
    for (const item of visibleNavItems) {
      const href = item.href(slug)
      const candidates = [href, ...(item.alsoActive?.(slug) ?? [])]
      for (const candidate of candidates) {
        const isDashboardRoot = candidate === `/merchant/${slug}`
        const matches = isDashboardRoot
          ? pathname === candidate
          : pathname === candidate || pathname.startsWith(`${candidate}/`)
        if (matches && candidate.length > bestLength) {
          best = href
          bestLength = candidate.length
        }
      }
    }
    return best
  })()
  const isActive = (href: string) => activeHref === href

  const getNavLabel = (labelKey: string, fallback: string) => {
    const translated = tNav(labelKey as never)
    return translated === labelKey || translated === `nav.${labelKey}` ? fallback : translated
  }

  const bottomNavItems = bottomNavKeys
    .map((key) => visibleNavItems.find((item) => item.labelKey === key))
    .filter((item): item is NavItem => Boolean(item))

  const renderStats = (compact: boolean) => (
    <div className={cn("grid gap-3", compact ? "grid-cols-3 gap-2" : "grid-cols-3")}>
      {stats.map((stat) => {
        const Icon = stat.icon ? statIcons[stat.icon] : Sparkles
        return (
          <div key={stat.label} className="flex items-center gap-2 min-w-0">
            {!compact && (
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className={cn("text-[var(--text-faint)] truncate", compact ? "text-[10px]" : "text-xs")}>{stat.label}</div>
              <div className={cn("font-semibold text-[var(--text)] tabular-nums", compact && "text-sm")}>{stat.value}</div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--surface)] border-b border-[var(--border)] shadow-warm-sm">
        <div className="flex items-center justify-between gap-2 px-4 h-16">
          <Link href={`/merchant/${slug}/dashboard`} className="flex items-center gap-2 min-w-0">
            <span className="w-10 h-10 rounded-[12px] gradient-brand flex items-center justify-center shadow-warm flex-shrink-0" />
            <span className="text-xl font-bold text-[var(--text)] truncate">{merchantName}</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-[12px] flex items-center justify-center hover:bg-[var(--surface-dim)] transition-colors flex-shrink-0"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="merchant-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-[var(--text)]" /> : <Menu className="h-6 w-6 text-[var(--text)]" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)} />
            <div
              id="merchant-mobile-menu"
              className="fixed top-16 left-0 right-0 bottom-0 bg-[var(--surface)] z-50 overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-wide text-[var(--text-faint)]">Language</span>
                  <LanguageSelector variant="compact" />
                </div>
                {visibleGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">{group.title}</p>
                    {group.items.map((item) => {
                      const href = item.href(slug)
                      const Icon = item.icon
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          aria-current={isActive(href) ? "page" : undefined}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all",
                            isActive(href)
                              ? "gradient-brand text-[var(--primary-foreground)] shadow-warm"
                              : "text-[var(--text-muted)] hover:bg-[var(--surface-dim)]"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="flex-1">{getNavLabel(item.labelKey, item.fallback)}</span>
                          {item.external && (
                            <span className="flex items-center gap-1 text-[11px] text-[var(--text-faint)]">
                              Opens app area <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                ))}
                <SignOutButton className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium text-[var(--danger)] hover:bg-[#FEE2E2] transition-all" />
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
            <div className="w-12 h-12 rounded-[14px] gradient-brand flex items-center justify-center shadow-warm flex-shrink-0" />
            <span
              className={cn(
                "text-2xl font-bold text-[var(--text)] transition-opacity duration-300 truncate",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              {merchantName}
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

          <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto overflow-x-hidden" aria-label="Merchant">
            {visibleGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {collapsed ? (
                  <div className="mx-auto my-1 h-px w-8 bg-[var(--border)]" aria-hidden="true" />
                ) : (
                  <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                    {group.title}
                  </p>
                )}
                {group.items.map((item) => {
                  const href = item.href(slug)
                  const Icon = item.icon
                  const label = getNavLabel(item.labelKey, item.fallback)
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={item.external ? `${label} (opens the app area, outside this merchant)` : collapsed ? label : undefined}
                      aria-current={isActive(href) ? "page" : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-[14px] font-medium transition-all relative group",
                        isActive(href)
                          ? "gradient-brand text-[var(--primary-foreground)] shadow-warm"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-dim)]",
                        collapsed && "justify-center"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span
                        className={cn(
                          "transition-all duration-300 whitespace-nowrap flex-1",
                          collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                        )}
                      >
                        {label}
                      </span>
                      {item.external && !collapsed && (
                        <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-[var(--text-faint)]" aria-label="Opens outside the merchant area" />
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--text)] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                          {label}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-[var(--border)]">
            <div
              className={cn(
                "bg-gradient-to-br from-[var(--bg-2)] to-[#FFE5B4] rounded-[14px] p-4 mb-3 transition-all",
                collapsed && "bg-none p-0 mb-4 bg-transparent"
              )}
            >
              <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "mb-1")}>
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center font-semibold text-[var(--primary-foreground)] flex-shrink-0">
                  {merchantName.slice(0, 2).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[var(--text)] text-sm truncate">{merchantName}</div>
                    <div className="text-xs text-[var(--text-faint)] truncate">{userLabel}</div>
                  </div>
                )}
              </div>
            </div>
            <SignOutButton
              variant="outline"
              size="sm"
              fullWidth
              iconOnly={collapsed}
              className={collapsed ? "px-0 justify-center" : ""}
            />
          </div>
        </div>
      </aside>

      <main className={cn("transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        {/* Phones: one compact, non-sticky KPI row (the fixed top bar already takes 64px). */}
        <div className="lg:hidden border-b border-[var(--border)] bg-gradient-to-r from-[var(--bg-2)] to-[#FFE5B4]/30 px-4 py-2">
          {renderStats(true)}
        </div>

        <div className="hidden lg:block sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
          <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-6 bg-gradient-to-r from-[var(--bg-2)] to-[#FFE5B4]/30">
            <div className="flex-1 min-w-0 max-w-2xl">{renderStats(false)}</div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">Language</span>
              <LanguageSelector variant="compact" />
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">{children}</div>
      </main>

      <nav
        aria-label="Quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 bg-[var(--surface)] border-t border-[var(--border)] shadow-warm-lg z-40 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 gap-1 px-2 h-16 items-center">
          {bottomNavItems.map((item) => {
            const href = item.href(slug)
            const Icon = item.icon
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-12 px-1 rounded-[12px] transition-all min-w-0",
                  isActive(href)
                    ? "gradient-brand text-[var(--primary-foreground)]"
                    : "text-[var(--text-faint)] hover:bg-[var(--surface-dim)]"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-[10px] font-medium truncate max-w-full">{getNavLabel(item.labelKey, item.fallback)}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-controls="merchant-mobile-menu"
            aria-expanded={mobileMenuOpen}
            className="flex flex-col items-center justify-center gap-1 h-12 px-1 rounded-[12px] text-[var(--text-faint)] hover:bg-[var(--surface-dim)] transition-all"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Spacer matching the bottom bar (64px + safe area) so content is never hidden. */}
      <div className="lg:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" />
    </div>
  )
}
