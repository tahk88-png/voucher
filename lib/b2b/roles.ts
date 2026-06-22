/**
 * B2B Organization Role Permissions.
 *
 * Maps OrgRole → set of org-level permissions.
 * Used by B2B org navigation and <Can> components.
 */

export const ORG_PERMISSIONS = [
  "org.read",
  "org.manage",
  "org.members.manage",
  "org.campaigns.read",
  "org.campaigns.manage",
  "org.vouchers.read",
  "org.vouchers.issue",
  "org.orders.read",
  "org.orders.manage",
  "org.billing.read",
  "org.billing.manage",
  "org.reports.read",
  "org.reports.export",
  "org.audit.read",
  "org.keys.manage",
  "org.invitations.manage",
] as const;

export type OrgPermission = (typeof ORG_PERMISSIONS)[number];

export type OrgRoleType =
  | "owner"
  | "admin"
  | "finance"
  | "marketing"
  | "support"
  | "partner_cashier"
  | "auditor";

const allPermissions: readonly OrgPermission[] = [...ORG_PERMISSIONS];

export const ORG_ROLE_PERMISSIONS: Record<OrgRoleType, readonly OrgPermission[]> = {
  owner: allPermissions,

  admin: [
    "org.read", "org.manage",
    "org.members.manage", "org.invitations.manage",
    "org.campaigns.read", "org.campaigns.manage",
    "org.vouchers.read", "org.vouchers.issue",
    "org.orders.read", "org.orders.manage",
    "org.billing.read", "org.billing.manage",
    "org.reports.read", "org.reports.export",
    "org.audit.read",
    "org.keys.manage",
  ],

  finance: [
    "org.read",
    "org.orders.read", "org.orders.manage",
    "org.billing.read", "org.billing.manage",
    "org.reports.read", "org.reports.export",
  ],

  marketing: [
    "org.read",
    "org.campaigns.read", "org.campaigns.manage",
    "org.vouchers.read", "org.vouchers.issue",
    "org.reports.read",
  ],

  support: [
    "org.read",
    "org.vouchers.read",
    "org.orders.read",
    "org.reports.read",
  ],

  partner_cashier: [
    "org.read",
    "org.vouchers.read",
  ],

  auditor: [
    "org.read",
    "org.audit.read",
    "org.reports.read",
    "org.reports.export",
    "org.orders.read",
    "org.campaigns.read",
    "org.vouchers.read",
  ],
};

export function hasOrgPermission(role: OrgRoleType, permission: OrgPermission): boolean {
  return ORG_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ORG_ROLE_LABELS: Record<OrgRoleType, string> = {
  owner: "Owner",
  admin: "Admin",
  finance: "Finance",
  marketing: "Marketing",
  support: "Support",
  partner_cashier: "Cashier",
  auditor: "Auditor",
};
