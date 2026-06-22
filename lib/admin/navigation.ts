/**
 * Admin navigation items with permission gating.
 *
 * Each admin sub-role only sees items they have permission for.
 * Used by AdminShell to render a filtered sidebar.
 */

import type { AdminPermission, AdminRoleType } from "./roles";
import { hasAdminPermission } from "./roles";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string; // lucide icon name
  requiredPermission: AdminPermission;
  section: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  // Overview
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", requiredPermission: "admin.ops.dashboard", section: "Overview" },

  // Users & Moderation
  { label: "Users", href: "/admin/users", icon: "Users", requiredPermission: "admin.users.read", section: "Users & Moderation" },
  { label: "Moderation", href: "/admin/moderation", icon: "Shield", requiredPermission: "admin.moderation.read", section: "Users & Moderation" },
  { label: "Support", href: "/admin/support", icon: "Headphones", requiredPermission: "admin.support.read", section: "Users & Moderation" },

  // Business
  { label: "Merchants", href: "/admin/merchants", icon: "Store", requiredPermission: "admin.merchants.read", section: "Business" },
  { label: "Billing", href: "/admin/billing", icon: "CreditCard", requiredPermission: "admin.billing.read", section: "Business" },
  { label: "Connect", href: "/admin/connect", icon: "Banknote", requiredPermission: "admin.billing.read", section: "Business" },

  // Analytics
  { label: "Analytics", href: "/admin/analytics", icon: "BarChart3", requiredPermission: "admin.analytics.read", section: "Analytics" },

  // Operations
  { label: "Email System", href: "/admin/email", icon: "Mail", requiredPermission: "admin.email.read", section: "Operations" },
  { label: "Feature Flags", href: "/admin/flags", icon: "Flag", requiredPermission: "admin.flags.read", section: "Operations" },
  { label: "Operations", href: "/admin/ops", icon: "Activity", requiredPermission: "admin.ops.read", section: "Operations" },
  { label: "Rate Limits", href: "/admin/rate-limits", icon: "Gauge", requiredPermission: "admin.ops.read", section: "Operations" },

  // Audit & Compliance
  { label: "Audit Log", href: "/admin/audit-log", icon: "FileText", requiredPermission: "admin.audit.read", section: "Compliance" },

  // System (super_admin only)
  { label: "Control Panel", href: "/admin/control-panel", icon: "Settings", requiredPermission: "admin.system.manage", section: "System" },
];

/**
 * Filter nav items by admin role.
 */
export function getAdminNavForRole(role: AdminRoleType): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => hasAdminPermission(role, item.requiredPermission));
}

/**
 * Group nav items by section.
 */
export function groupAdminNav(items: AdminNavItem[]): Record<string, AdminNavItem[]> {
  const groups: Record<string, AdminNavItem[]> = {};
  for (const item of items) {
    if (!groups[item.section]) groups[item.section] = [];
    groups[item.section].push(item);
  }
  return groups;
}
