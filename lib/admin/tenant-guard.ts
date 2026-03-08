/**
 * Tenant boundary guard for admin queries.
 *
 * Ensures every admin query is tenant-scoped:
 * - Regular admins query within their assigned tenant(s).
 * - super_admin can override to any tenant via `x-tenant-override` header,
 *   but the override is always audited.
 *
 * For this platform the "tenant" is a Merchant. An admin may be associated
 * with specific merchants or may be a platform-level admin (no merchant
 * restriction).
 */

import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { recordAdminAudit } from "./audit";
import type { AdminContext } from "./guards";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantScope = {
  /** Resolved merchant/tenant ID for this request. `null` = platform-wide. */
  merchantId: string | null;
  /** Whether a super_admin used the x-tenant-override header. */
  isOverride: boolean;
};

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

/**
 * Resolve the tenant scope for the current admin request.
 *
 * @param admin - The authenticated admin context (from `requireAdminProfile` / `requireAdminPermission`).
 * @param requestedMerchantId - An explicit merchant ID from the route/query (e.g. path param or ?merchantId=).
 *
 * @returns The resolved tenant scope. If `merchantId` is non-null every DB
 *          query in the handler should include `{ merchantId }` in its `where`.
 *
 * @throws {Error} if a non-super_admin tries to use the override header.
 */
export async function resolveTenantScope(
  admin: AdminContext,
  requestedMerchantId?: string | null,
): Promise<TenantScope> {
  const headerStore = await headers();
  const overrideHeader = headerStore.get("x-tenant-override");

  // ---- super_admin with override header -----------------------------------
  if (overrideHeader) {
    if (admin.adminRole !== "super_admin") {
      throw new Error("Only super_admin may use the x-tenant-override header.");
    }

    // Audit the override
    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "tenant.override",
      targetType: "Merchant",
      targetId: overrideHeader,
      metadata: {
        tenant_override: overrideHeader,
        originalRequestedMerchantId: requestedMerchantId ?? null,
      },
    });

    logger.warn("Tenant override used by super_admin", {
      adminId: admin.userId,
      overrideMerchantId: overrideHeader,
    });

    return { merchantId: overrideHeader, isOverride: true };
  }

  // ---- Explicit merchant from route/query ---------------------------------
  if (requestedMerchantId) {
    return { merchantId: requestedMerchantId, isOverride: false };
  }

  // ---- Platform-wide (no tenant filter) -----------------------------------
  // super_admin and platform-level roles see all merchants by default.
  return { merchantId: null, isOverride: false };
}

/**
 * Build a Prisma `where` clause that enforces tenant scope.
 *
 * Example:
 * ```ts
 * const tenantWhere = tenantWhereClause(scope);
 * const records = await prisma.voucher.findMany({
 *   where: { ...tenantWhere, status: 'published' },
 * });
 * ```
 */
export function tenantWhereClause(scope: TenantScope): { merchantId?: string } {
  if (scope.merchantId) {
    return { merchantId: scope.merchantId };
  }
  return {};
}
