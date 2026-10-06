"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useNotificationsSSE } from "@/hooks/use-notifications-sse"
import { Menu, X, Gift, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CountrySelector } from "@/components/navigation/country-selector"
import { LanguageSelector } from "@/components/navigation/language-selector"
import { useCountry } from "@/components/contexts/country-context"
import { RoleSwitcher, type RoleSwitcherMerchant, type RoleSwitcherOrg } from "@/components/navigation/role-switcher"
import { SignOutButton } from "@/components/sign-out-button"
import {
  userNavItems,
  isNavItemActive,
  sectionLabelKeys,
  type NavItem,
  type NavSection,
} from "@/app/(user)/app/_components/user-nav"

interface UserShellProps {
  userLabel: string
  roles?: string[]
  merchantMemberships?: RoleSwitcherMerchant[]
  orgMemberships?: RoleSwitcherOrg[]
  /** Shows the B2B organisations entry. Organisations are invite-only, so shoppers without one never see it. */
  hasOrgs?: boolean
  adminRole?: string | null
  children: React.ReactNode
}

export default function UserShell({
  userLabel,
  roles = [],
  merchantMemberships = [],
  orgMemberships = [],
  hasOrgs = false,
  adminRole,
  children,
}: UserShellProps) {
  const pathname = usePathname()
  const tNav = useTranslations("nav")
  const locale = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { selectedCountry } = useCountry()
  const { unreadCount } = useNotificationsSSE(true)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const visibleItems = userNavItems.filter((item) => !item.requiresOrgs || hasOrgs)
  const mainItems = visibleItems.filter((item) => item.section !== "account")
  const accountItems = visibleItems.filter((item) => item.section === "account")
  const bottomNavItems = userNavItems.filter((item) => item.bottomNav)

  useEffect(() => {
    const contentCreationPaths = ["/create", "/edit", "/analytics"]
    if (contentCreationPaths.some((path) => pathname.includes(path))) {
      setCollapsed(true)
    }
  }, [pathname])

  const closeMobileMenu = useCallback((restoreFocus: boolean) => {
    setMobileMenuOpen(false)
    if (restoreFocus) {
      // Return focus to the toggle that opened the menu.
      requestAnimationFrame(() => menuButtonRef.current?.focus())
    }
  }, [])

  // Close the menu on navigation.
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeMobileMenu(true)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    // Move focus into the menu so keyboard users land on the first link.
    mobileMenuRef.current?.querySelector<HTMLElement>("a, button")?.focus()
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [mobileMenuOpen, closeMobileMenu])

  const label = (labelKey: string) => tNav(labelKey as never)

  // Market names in lib/locale-config are English; other languages take the
  // region name from Intl.
  const countryName = (() => {
    if (locale === "en") return selectedCountry.name
    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(selectedCountry.code) ?? selectedCountry.name
    } catch {
      return selectedCountry.name
    }
  })()

  const renderBadge = (item: NavItem) =>
    item.href === "/app/notifications" && unreadCount > 0 ? (
      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    ) : null

  const renderSidebarLink = (item: NavItem) => {
    const Icon = item.icon
    const active = isNavItemActive(pathname, item)
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        title={collapsed ? label(item.labelKey) : undefined}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-[14px] font-medium transition-all relative group",
          active ? "gradient-brand text-[var(--primary-foreground)] shadow-warm" : "text-[var(--text-muted)] hover:bg-[var(--surface-dim)]",
          collapsed && "justify-center"
        )}
      >
        <span className="relative flex-shrink-0">
          <Icon className="h-5 w-5" aria-hidden="true" />
          {renderBadge(item)}
        </span>
        <span
          className={cn(
            "transition-all duration-300 whitespace-nowrap",
            collapsed ? "sr-only" : "w-auto opacity-100"
          )}
        >
          {label(item.labelKey)}
        </span>
      </Link>
    )
  }

  const renderMobileLink = (item: NavItem) => {
    const Icon = item.icon
    const active = isNavItemActive(pathname, item)
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all",
          active ? "gradient-brand text-[var(--primary-foreground)] shadow-warm" : "text-[var(--text-muted)] hover:bg-[var(--surface-dim)]"
        )}
      >
        <span className="relative flex-shrink-0">
          <Icon className="h-5 w-5" aria-hidden="true" />
          {renderBadge(item)}
        </span>
        {label(item.labelKey)}
      </Link>
    )
  }

  const sections: NavSection[] = ["shop", "rewards"]

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Mobile top bar: the only sticky element on small screens. */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--surface)] border-b border-[var(--border)] shadow-warm-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/app" className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-[12px] gradient-brand flex items-center justify-center shadow-warm shrink-0">
              <Gift className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-[var(--text)] truncate">GiftHub</span>
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => (mobileMenuOpen ? closeMobileMenu(false) : setMobileMenuOpen(true))}
            className="w-10 h-10 rounded-[12px] flex items-center justify-center hover:bg-[var(--surface-dim)] transition-colors"
            aria-label={mobileMenuOpen ? tNav("closeMenu") : tNav("openMenu")}
            aria-expanded={mobileMenuOpen}
            aria-controls="user-mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[var(--text)]" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6 text-[var(--text)]" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu: rendered outside the header so its backdrop never covers the header or its close button. */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-black/20 z-40"
            aria-hidden="true"
            onClick={() => closeMobileMenu(true)}
          />
          <div
            id="user-mobile-menu"
            ref={mobileMenuRef}
            className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-[var(--surface)] z-40 overflow-y-auto overscroll-contain"
          >
            <nav aria-label={tNav("mainNavigation")} className="p-4 space-y-4">
              {sections.map((section) => (
                <div key={section} className="space-y-1">
                  <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                    {tNav(sectionLabelKeys[section] as never)}
                  </p>
                  {mainItems.filter((item) => item.section === section).map(renderMobileLink)}
                </div>
              ))}
              <div className="space-y-1 border-t border-[var(--border)] pt-4">
                {accountItems.map(renderMobileLink)}
                <SignOutButton className="w-full flex items-center px-4 py-3 rounded-[12px] font-medium text-[var(--danger)] hover:bg-[#FEE2E2] transition-all" />
              </div>
            </nav>
          </div>
        </>
      )}

      <div className="lg:hidden h-16" />

      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-[var(--surface)] border-r border-[var(--border)] shadow-warm-sm transition-all duration-300",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="relative flex items-center gap-3 px-6 py-5 border-b border-[var(--border)]">
            <div className="w-11 h-11 rounded-[14px] gradient-brand flex items-center justify-center shadow-warm flex-shrink-0">
              <Gift className="h-6 w-6 text-white" aria-hidden="true" />
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
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-8 bg-[var(--surface)] border border-[var(--border)] rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--danger)] shadow-sm hover:shadow-md transition-transform"
              aria-label={collapsed ? tNav("expandSidebar") : tNav("collapseSidebar")}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Scrolling part: shopping and rewards. */}
          <nav aria-label={tNav("mainNavigation")} className="flex-1 px-4 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
            {sections.map((section) => (
              <div key={section} className="space-y-1">
                {!collapsed && (
                  <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                    {tNav(sectionLabelKeys[section] as never)}
                  </p>
                )}
                {mainItems.filter((item) => item.section === section).map(renderSidebarLink)}
              </div>
            ))}
          </nav>

          {/* Pinned part: account items, user card and logout stay visible without scrolling. */}
          <div className="px-4 pt-3 pb-4 border-t border-[var(--border)] space-y-1">
            {accountItems.map(renderSidebarLink)}

            {!collapsed && roles.length > 0 && (
              <div className="pt-2">
                <RoleSwitcher
                  roles={roles}
                  merchantMemberships={merchantMemberships}
                  orgMemberships={orgMemberships}
                  adminRole={adminRole}
                />
              </div>
            )}

            <div className={cn("flex items-center gap-3 pt-3", collapsed && "justify-center")}>
              <div
                className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-sm font-semibold text-[var(--primary-foreground)] flex-shrink-0"
                aria-hidden="true"
              >
                {userLabel.slice(0, 2).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text)] text-sm truncate">{userLabel}</div>
                </div>
              )}
              {!collapsed && <SignOutButton variant="ghost" size="sm" iconOnly className="px-2" />}
            </div>
            {collapsed && (
              <div className="flex justify-center pt-2">
                <SignOutButton variant="ghost" size="sm" iconOnly className="px-2" />
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={cn("transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        {/* Market / language bar. Sticky on desktop only; on phones the fixed top bar is the only sticky element. */}
        <div className="lg:sticky lg:top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
          <div className="px-4 py-2 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-xl leading-none" aria-hidden="true">
                {selectedCountry.flag}
              </span>
              <div className="min-w-0">
                <div className="text-xs text-[var(--text-faint)]">{tNav("marketplace")}</div>
                <div className="font-semibold text-[var(--text)] text-sm truncate">{countryName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <LanguageSelector variant="compact" />
              <CountrySelector variant="compact" />
            </div>
          </div>
        </div>

        <div
          className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-[calc(64px+1.5rem+env(safe-area-inset-bottom))] lg:pb-6"
        >
          {children}
        </div>
      </main>

      <nav
        aria-label={tNav("quickNavigation")}
        className="lg:hidden fixed bottom-0 inset-x-0 bg-[var(--surface)] border-t border-[var(--border)] shadow-warm-lg z-40 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 gap-1 px-2 h-16 items-center">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isNavItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-14 px-1 rounded-[12px] transition-all min-w-0",
                  active ? "gradient-brand text-[var(--primary-foreground)]" : "text-[var(--text-faint)] hover:bg-[var(--surface-dim)]"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-tight truncate max-w-full">{label(item.labelKey)}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
