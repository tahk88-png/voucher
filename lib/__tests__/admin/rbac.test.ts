import { describe, it, expect } from "vitest";
import {
  hasAdminPermission,
  isStepUpRequired,
  ADMIN_ROLES,
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_PERMISSIONS,
  type AdminRoleType,
  type AdminPermission,
} from "@/lib/admin/roles";

describe("Admin RBAC", () => {
  // ---- Role definitions ---------------------------------------------------

  it("should define exactly 5 admin roles", () => {
    expect(ADMIN_ROLES).toHaveLength(5);
    expect(ADMIN_ROLES).toContain("super_admin");
    expect(ADMIN_ROLES).toContain("ops_admin");
    expect(ADMIN_ROLES).toContain("billing_admin");
    expect(ADMIN_ROLES).toContain("moderator");
    expect(ADMIN_ROLES).toContain("support_admin");
  });

  it("should define at least 30 permissions", () => {
    expect(ADMIN_PERMISSIONS.length).toBeGreaterThanOrEqual(30);
  });

  // ---- super_admin --------------------------------------------------------

  it("super_admin should have ALL permissions", () => {
    for (const perm of ADMIN_PERMISSIONS) {
      expect(hasAdminPermission("super_admin", perm)).toBe(true);
    }
  });

  // ---- Role restrictions --------------------------------------------------

  it("moderator should NOT have billing permissions", () => {
    expect(hasAdminPermission("moderator", "admin.billing.refund")).toBe(false);
    expect(hasAdminPermission("moderator", "admin.billing.payout_hold")).toBe(false);
  });

  it("billing_admin should NOT have moderation action permission", () => {
    expect(hasAdminPermission("billing_admin", "admin.moderation.action")).toBe(false);
  });

  it("support_admin should NOT have ban permission", () => {
    expect(hasAdminPermission("support_admin", "admin.users.ban")).toBe(false);
  });

  it("ops_admin should have ops permissions", () => {
    expect(hasAdminPermission("ops_admin", "admin.ops.read")).toBe(true);
    expect(hasAdminPermission("ops_admin", "admin.ops.retry_jobs")).toBe(true);
    expect(hasAdminPermission("ops_admin", "admin.ops.health")).toBe(true);
  });

  it("moderator should have moderation + ban/unban permissions", () => {
    expect(hasAdminPermission("moderator", "admin.moderation.read")).toBe(true);
    expect(hasAdminPermission("moderator", "admin.moderation.action")).toBe(true);
    expect(hasAdminPermission("moderator", "admin.users.ban")).toBe(true);
    expect(hasAdminPermission("moderator", "admin.users.unban")).toBe(true);
  });

  it("billing_admin should have billing + analytics permissions", () => {
    expect(hasAdminPermission("billing_admin", "admin.billing.read")).toBe(true);
    expect(hasAdminPermission("billing_admin", "admin.billing.refund")).toBe(true);
    expect(hasAdminPermission("billing_admin", "admin.analytics.read")).toBe(true);
  });

  // ---- Every role has at least read access --------------------------------

  it("every role should have at least admin.users.read", () => {
    for (const role of ADMIN_ROLES) {
      expect(hasAdminPermission(role, "admin.users.read")).toBe(true);
    }
  });

  // ---- Permission matrix completeness ------------------------------------

  it("every role in ADMIN_ROLES should have an entry in ADMIN_ROLE_PERMISSIONS", () => {
    for (const role of ADMIN_ROLES) {
      expect(ADMIN_ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(ADMIN_ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it("every permission in role arrays should be a valid ADMIN_PERMISSION", () => {
    const validPerms = new Set<string>(ADMIN_PERMISSIONS);
    for (const role of ADMIN_ROLES) {
      for (const perm of ADMIN_ROLE_PERMISSIONS[role]) {
        expect(validPerms.has(perm)).toBe(true);
      }
    }
  });

  // ---- Step-up actions ----------------------------------------------------

  it("ban, refund, payout_hold, delete, impersonate should require step-up", () => {
    expect(isStepUpRequired("admin.users.ban")).toBe(true);
    expect(isStepUpRequired("admin.users.impersonate")).toBe(true);
    expect(isStepUpRequired("admin.users.delete")).toBe(true);
    expect(isStepUpRequired("admin.billing.refund")).toBe(true);
    expect(isStepUpRequired("admin.billing.payout_hold")).toBe(true);
    expect(isStepUpRequired("admin.flags.rollout_100")).toBe(true);
    expect(isStepUpRequired("admin.legal_hold.manage")).toBe(true);
  });

  it("read-only permissions should NOT require step-up", () => {
    expect(isStepUpRequired("admin.users.read")).toBe(false);
    expect(isStepUpRequired("admin.merchants.read")).toBe(false);
    expect(isStepUpRequired("admin.billing.read")).toBe(false);
    expect(isStepUpRequired("admin.audit.read")).toBe(false);
    expect(isStepUpRequired("admin.ops.read")).toBe(false);
  });
});
