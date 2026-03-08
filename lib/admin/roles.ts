/**
 * Admin RBAC: Role definitions, permission matrix, and step-up action list.
 *
 * 5 admin roles with a 30+ permission matrix covering all platform domains.
 * Step-up actions require re-authentication before execution.
 */

// ---------------------------------------------------------------------------
// Admin Roles
// ---------------------------------------------------------------------------

export const ADMIN_ROLES = [
  'super_admin',
  'ops_admin',
  'billing_admin',
  'moderator',
  'support_admin',
] as const;

export type AdminRoleType = (typeof ADMIN_ROLES)[number];

// ---------------------------------------------------------------------------
// Admin Permissions
// ---------------------------------------------------------------------------

export const ADMIN_PERMISSIONS = [
  // Users
  'admin.users.read',
  'admin.users.ban',
  'admin.users.unban',
  'admin.users.impersonate',
  'admin.users.delete',

  // Merchants
  'admin.merchants.read',
  'admin.merchants.activate',
  'admin.merchants.deactivate',
  'admin.merchants.edit',

  // Billing
  'admin.billing.read',
  'admin.billing.refund',
  'admin.billing.payout_hold',
  'admin.billing.subscription_manage',

  // Moderation
  'admin.moderation.read',
  'admin.moderation.action',
  'admin.moderation.appeal_review',

  // Support
  'admin.support.read',
  'admin.support.manage',

  // Audit
  'admin.audit.read',
  'admin.audit.export',
  'admin.audit.verify',

  // Feature Flags
  'admin.flags.read',
  'admin.flags.manage',
  'admin.flags.rollout_100',

  // Ops
  'admin.ops.read',
  'admin.ops.retry_jobs',
  'admin.ops.health',
  'admin.ops.metrics',
  'admin.ops.dashboard',
  'admin.ops.dns',

  // Analytics
  'admin.analytics.read',
  'admin.analytics.export',

  // System
  'admin.system.manage',

  // Legal Hold
  'admin.legal_hold.manage',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

// ---------------------------------------------------------------------------
// Role -> Permission mapping
// ---------------------------------------------------------------------------

const ALL_PERMISSIONS: readonly AdminPermission[] = [...ADMIN_PERMISSIONS];

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRoleType, readonly AdminPermission[]> = {
  super_admin: ALL_PERMISSIONS,

  ops_admin: [
    // Merchants (full)
    'admin.merchants.read',
    'admin.merchants.activate',
    'admin.merchants.deactivate',
    'admin.merchants.edit',
    // Users (read-only)
    'admin.users.read',
    // Audit (full)
    'admin.audit.read',
    'admin.audit.export',
    'admin.audit.verify',
    // Flags (read + manage)
    'admin.flags.read',
    'admin.flags.manage',
    // Ops (full)
    'admin.ops.read',
    'admin.ops.retry_jobs',
    'admin.ops.health',
    'admin.ops.metrics',
    'admin.ops.dashboard',
    'admin.ops.dns',
    // Analytics (full)
    'admin.analytics.read',
    'admin.analytics.export',
    // Moderation (read-only)
    'admin.moderation.read',
  ],

  billing_admin: [
    // Billing (full)
    'admin.billing.read',
    'admin.billing.refund',
    'admin.billing.payout_hold',
    'admin.billing.subscription_manage',
    // Users (read-only)
    'admin.users.read',
    // Merchants (read-only)
    'admin.merchants.read',
    // Audit (read-only)
    'admin.audit.read',
    // Analytics (full)
    'admin.analytics.read',
    'admin.analytics.export',
  ],

  moderator: [
    // Moderation (full)
    'admin.moderation.read',
    'admin.moderation.action',
    'admin.moderation.appeal_review',
    // Users (read + ban/unban)
    'admin.users.read',
    'admin.users.ban',
    'admin.users.unban',
    // Merchants (read-only)
    'admin.merchants.read',
    // Support (read-only)
    'admin.support.read',
    // Audit (read-only)
    'admin.audit.read',
  ],

  support_admin: [
    // Support (full)
    'admin.support.read',
    'admin.support.manage',
    // Users (read-only)
    'admin.users.read',
    // Merchants (read-only)
    'admin.merchants.read',
    // Billing (read-only)
    'admin.billing.read',
    // Moderation (read-only)
    'admin.moderation.read',
    // Audit (read-only)
    'admin.audit.read',
  ],
};

// ---------------------------------------------------------------------------
// Step-up actions (require re-authentication)
// ---------------------------------------------------------------------------

export const STEP_UP_ACTIONS: readonly AdminPermission[] = [
  'admin.users.ban',
  'admin.users.impersonate',
  'admin.users.delete',
  'admin.billing.refund',
  'admin.billing.payout_hold',
  'admin.flags.rollout_100',
  'admin.legal_hold.manage',
  'admin.system.manage',
] as const;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Check whether the given admin role has the specified permission.
 */
export function hasAdminPermission(role: AdminRoleType, permission: AdminPermission): boolean {
  const permissions = ADMIN_ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check whether the given permission requires step-up re-authentication.
 */
export function isStepUpRequired(permission: AdminPermission): boolean {
  return (STEP_UP_ACTIONS as readonly AdminPermission[]).includes(permission);
}
