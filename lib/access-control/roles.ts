export const APP_ROLES = [
  "guest",
  "end_user",
  "tenant_staff",
  "tenant_owner",
  "platform_admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const TENANT_MEMBERSHIP_ROLES = ["merchant_staff", "merchant_admin"] as const;
export type TenantMembershipRole = (typeof TENANT_MEMBERSHIP_ROLES)[number];

export const APP_PERMISSIONS = [
  "platform.read",
  "platform.manage",
  "tenant.read",
  "tenant.manage",
  "tenant.members.manage",
  "campaign.read",
  "campaign.create",
  "campaign.update",
  "campaign.delete",
  "voucher.read",
  "voucher.create",
  "voucher.publish",
  "voucher.redeem",
  "billing.read",
  "billing.manage",
  "shop.checkout",
  "rental.book",
  "wallet.read",
  "referral.create",
] as const;

export type AppPermission = (typeof APP_PERMISSIONS)[number];

export type RoleDefinition = {
  purpose: string;
  coreValue: string;
  can: readonly string[];
  cannot: readonly string[];
};

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  guest: {
    purpose: "Anonymous visitor before authentication.",
    coreValue: "Discover catalog and public campaigns quickly.",
    can: [
      "Browse public campaigns, products, rentals, and events",
      "Open login and registration flows",
      "Validate public voucher metadata",
    ],
    cannot: [
      "Access dashboards",
      "Create or manage merchant resources",
      "Purchase or redeem with account-bound actions",
    ],
  },
  end_user: {
    purpose: "Customer account for buying, renting, and redeeming offers.",
    coreValue: "Save money and track rewards in one place.",
    can: [
      "Buy vouchers and tickets",
      "Book rentals and manage wallet",
      "Share referrals and track rewards",
    ],
    cannot: [
      "Manage merchant settings, billing, or team members",
      "Access platform admin controls",
      "Modify tenant business resources",
    ],
  },
  tenant_staff: {
    purpose: "Operational staff member inside a merchant tenant.",
    coreValue: "Run daily operations safely without billing/admin risk.",
    can: [
      "View merchant dashboard data",
      "Review campaigns and vouchers",
      "Confirm redemptions and run frontline operations",
    ],
    cannot: [
      "Invite team members",
      "Change billing or subscription",
      "Delete tenant-critical resources",
    ],
  },
  tenant_owner: {
    purpose: "Primary merchant owner/admin for tenant business operations.",
    coreValue: "Control revenue features, team, and monetization settings.",
    can: [
      "Create, edit, publish campaigns and vouchers",
      "Invite/manage tenant team members",
      "Manage tenant billing and settings",
    ],
    cannot: [
      "Access global platform internals across all tenants",
      "Bypass platform-level compliance controls",
      "Edit unrelated tenant data",
    ],
  },
  platform_admin: {
    purpose: "GiftHub internal platform operator.",
    coreValue: "Maintain platform safety, quality, and multi-tenant governance.",
    can: [
      "View and manage all tenants",
      "Review global audit and billing surfaces",
      "Toggle tenant-level platform controls",
    ],
    cannot: [
      "Bypass immutable audit requirements",
      "Ignore payment/entitlement rules in business APIs",
      "Act outside compliance boundaries",
    ],
  },
};

const endUserPermissions: readonly AppPermission[] = [
  "shop.checkout",
  "rental.book",
  "wallet.read",
  "referral.create",
];

const staffPermissions: readonly AppPermission[] = [
  "tenant.read",
  "campaign.read",
  "voucher.read",
  "voucher.redeem",
  "billing.read",
];

const ownerPermissions: readonly AppPermission[] = [
  ...staffPermissions,
  "tenant.manage",
  "tenant.members.manage",
  "campaign.create",
  "campaign.update",
  "campaign.delete",
  "voucher.create",
  "voucher.publish",
  "billing.manage",
];

export const ROLE_PERMISSION_MATRIX: Record<AppRole, readonly AppPermission[]> = {
  guest: [],
  end_user: endUserPermissions,
  tenant_staff: [...staffPermissions, ...endUserPermissions],
  tenant_owner: [...ownerPermissions, ...endUserPermissions],
  platform_admin: [...APP_PERMISSIONS],
};

export type RoleRouteMap = {
  defaultLanding: string;
  allowedRoutes: readonly string[];
  navigation: readonly { label: string; href: string }[];
};

export const ROLE_ROUTE_MAP: Record<AppRole, RoleRouteMap> = {
  guest: {
    defaultLanding: "/",
    allowedRoutes: ["/", "/campaigns", "/shop", "/rent", "/voucher", "/gift-card/:id", "/event/:id", "/login"],
    navigation: [
      { label: "Campaigns", href: "/campaigns" },
      { label: "Shop", href: "/shop" },
      { label: "Rent", href: "/rent" },
      { label: "Login", href: "/login" },
    ],
  },
  end_user: {
    defaultLanding: "/app",
    allowedRoutes: ["/app", "/app/referrals", "/app/wallet", "/app/notifications", "/app/settings", "/campaigns", "/shop", "/rent"],
    navigation: [
      { label: "Home", href: "/app" },
      { label: "Referrals", href: "/app/referrals" },
      { label: "Wallet", href: "/app/wallet" },
      { label: "Settings", href: "/app/settings" },
    ],
  },
  tenant_staff: {
    defaultLanding: "/merchant/:slug/dashboard",
    allowedRoutes: [
      "/merchant/:slug/dashboard",
      "/merchant/:slug/campaigns",
      "/merchant/:slug/vouchers",
      "/merchant/:slug/events",
      "/merchant/:slug/redemptions",
    ],
    navigation: [
      { label: "Dashboard", href: "/merchant/:slug/dashboard" },
      { label: "Campaigns", href: "/merchant/:slug/campaigns" },
      { label: "Vouchers", href: "/merchant/:slug/vouchers" },
      { label: "Events", href: "/merchant/:slug/events" },
      { label: "Redemptions", href: "/merchant/:slug/redemptions" },
    ],
  },
  tenant_owner: {
    defaultLanding: "/merchant/:slug/dashboard",
    allowedRoutes: [
      "/merchant/:slug/dashboard",
      "/merchant/:slug/campaigns",
      "/merchant/:slug/campaigns/new",
      "/merchant/:slug/vouchers",
      "/merchant/:slug/vouchers/new",
      "/merchant/:slug/events",
      "/merchant/:slug/events/new",
      "/merchant/:slug/redemptions",
      "/merchant/:slug/members",
      "/merchant/:slug/page-builder",
      "/merchant/:slug/settings",
    ],
    navigation: [
      { label: "Dashboard", href: "/merchant/:slug/dashboard" },
      { label: "Campaigns", href: "/merchant/:slug/campaigns" },
      { label: "Vouchers", href: "/merchant/:slug/vouchers" },
      { label: "Events", href: "/merchant/:slug/events" },
      { label: "Team", href: "/merchant/:slug/members" },
      { label: "Settings", href: "/merchant/:slug/settings" },
    ],
  },
  platform_admin: {
    defaultLanding: "/admin",
    allowedRoutes: ["/admin", "/admin/merchants", "/admin/audit", "/merchant/:slug/*", "/app/*"],
    navigation: [
      { label: "Admin Home", href: "/admin" },
      { label: "Merchants", href: "/admin" },
      { label: "Audit", href: "/admin" },
    ],
  },
};

const ROLE_PRIORITY: readonly AppRole[] = [
  "platform_admin",
  "tenant_owner",
  "tenant_staff",
  "end_user",
  "guest",
];

export function roleFromTenantMembership(role: TenantMembershipRole): AppRole {
  return role === "merchant_admin" ? "tenant_owner" : "tenant_staff";
}

export function hasPermission(role: AppRole, permission: AppPermission): boolean {
  return ROLE_PERMISSION_MATRIX[role].includes(permission);
}

export function getHighestRole(roles: readonly AppRole[]): AppRole {
  for (const candidate of ROLE_PRIORITY) {
    if (roles.includes(candidate)) {
      return candidate;
    }
  }
  return "guest";
}

export function resolveDefaultLanding(role: AppRole, merchantSlug?: string): string {
  const template = ROLE_ROUTE_MAP[role].defaultLanding;
  if (template.includes(":slug")) {
    return template.replace(":slug", merchantSlug ?? "merchant");
  }
  return template;
}

