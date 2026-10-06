import {
  Award,
  Users,
  Wallet,
  Bell,
  Settings,
  Ticket,
  TrendingUp,
  Coins,
  Trophy,
  Heart,
  MapPin,
  Tag,
  Building2,
  type LucideIcon,
} from "lucide-react"

export type NavSection = "shop" | "rewards" | "account"

export interface NavItem {
  labelKey: string
  icon: LucideIcon
  href: string
  section: NavSection
  bottomNav?: boolean
  /** Only highlight on this exact path (the dashboard is the prefix of every /app page). */
  exact?: boolean
  requiresOrgs?: boolean
}

// Height of the mobile bottom tab bar, excluding the safe-area inset. The page
// content is padded by the same amount so nothing is hidden behind it.
export const BOTTOM_NAV_HEIGHT_PX = 64

export const userNavItems: NavItem[] = [
  { labelKey: "dashboard", icon: Award, href: "/app", section: "shop", bottomNav: true, exact: true },
  { labelKey: "myVouchers", icon: Ticket, href: "/app/vouchers", section: "shop", bottomNav: true },
  { labelKey: "deals", icon: Tag, href: "/campaigns", section: "shop" },
  { labelKey: "nearby", icon: MapPin, href: "/app/nearby", section: "shop" },
  { labelKey: "wishlist", icon: Heart, href: "/app/wishlist", section: "shop" },
  { labelKey: "referrals", icon: Users, href: "/app/referrals", section: "rewards", bottomNav: true },
  { labelKey: "wallet", icon: Wallet, href: "/app/wallet", section: "rewards", bottomNav: true },
  { labelKey: "cashback", icon: Coins, href: "/app/cashback", section: "rewards" },
  { labelKey: "achievements", icon: Trophy, href: "/app/achievements", section: "rewards" },
  { labelKey: "leaderboard", icon: TrendingUp, href: "/leaderboard", section: "rewards" },
  { labelKey: "b2b", icon: Building2, href: "/app/b2b", section: "account", requiresOrgs: true },
  { labelKey: "notifications", icon: Bell, href: "/app/notifications", section: "account" },
  { labelKey: "settings", icon: Settings, href: "/app/settings", section: "account", bottomNav: true },
]

export function isNavItemActive(pathname: string, item: Pick<NavItem, "href" | "exact">): boolean {
  if (pathname === item.href) return true
  if (item.exact) return false
  return pathname.startsWith(`${item.href}/`)
}

export const sectionLabelKeys: Record<NavSection, string> = {
  shop: "sectionShop",
  rewards: "sectionRewards",
  account: "sectionAccount",
}

