/**
 * B2B Org navigation items with role gating.
 */

import type { OrgPermission, OrgRoleType } from "./roles";
import { hasOrgPermission } from "./roles";

export type OrgNavItem = {
  label: string;
  href: string; // relative to /app/b2b/orgs/[orgId]
  icon: string;
  requiredPermission: OrgPermission;
};

export const ORG_NAV_ITEMS: OrgNavItem[] = [
  { label: "Overview", href: "", icon: "LayoutDashboard", requiredPermission: "org.read" },
  { label: "Campaigns", href: "/campaigns", icon: "Megaphone", requiredPermission: "org.campaigns.read" },
  { label: "Vouchers", href: "/vouchers", icon: "Ticket", requiredPermission: "org.vouchers.read" },
  { label: "Orders", href: "/orders", icon: "ShoppingCart", requiredPermission: "org.orders.read" },
  { label: "Reports", href: "/reports", icon: "BarChart3", requiredPermission: "org.reports.read" },
  { label: "Billing", href: "/billing", icon: "CreditCard", requiredPermission: "org.billing.read" },
  { label: "Audit", href: "/audit", icon: "FileText", requiredPermission: "org.audit.read" },
  { label: "API Keys", href: "/keys", icon: "Key", requiredPermission: "org.keys.manage" },
  { label: "Members", href: "/members", icon: "Users", requiredPermission: "org.members.manage" },
  { label: "Invitations", href: "/invitations", icon: "Mail", requiredPermission: "org.invitations.manage" },
];

export function getOrgNavForRole(role: OrgRoleType): OrgNavItem[] {
  return ORG_NAV_ITEMS.filter((item) => hasOrgPermission(role, item.requiredPermission));
}
